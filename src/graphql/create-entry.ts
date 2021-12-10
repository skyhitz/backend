import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql';
import { GraphQLUpload } from 'graphql-upload';

import Entry from './types/entry';
import { getAuthenticatedUser } from '../auth/logic';
import { entriesIndex } from '../algolia/algolia';
import { checkIfEntryOwnerHasStripeAccount } from '../payments/subscription';
import { issueAssetAndOpenSellOffer } from '../payments/stellar';
import { scard, redisClient } from '../redis';
import { buildNFT } from '../ipfs/storage';

async function checkPaymentsAccount(forSale: boolean, email: string) {
  if (forSale) {
    try {
      return await checkIfEntryOwnerHasStripeAccount(email);
    } catch (e) {
      console.log(e);
      throw 'could not check if entry owner has stripe account';
    }
  }
  return;
}

async function mapAssetIdToEntryId(entry, testing, assetCode) {
  let key = testing ? 'testing:all-assets' : 'all-assets';

  return new Promise((resolve, reject) => {
    redisClient
      .multi()
      .hmset(`assets:entry:${entry.id}`, assetCode, 1)
      .hmset(`assets:code:${assetCode}`, entry.id, 1)
      .sadd(`${key}`, assetCode)
      .exec((err) => {
        if (err) {
          console.log(err);
          return reject();
        }
        return resolve(true);
      });
  });
}

function generateAssetCode(totalEntries) {
  const res = 10000000000 + totalEntries;
  const newStr = res.toString().substring(1);

  return `SK${newStr}`;
}

async function setEntry(entry, testing): Promise<number> {
  let key = testing ? 'testing:all-entries' : 'all-entries';

  return new Promise((resolve, reject) => {
    redisClient
      .multi()
      .hmset(
        `entries:${entry.id}`,
        'description',
        entry.description,
        'title',
        entry.title,
        'id',
        entry.id,
        'videoUrl',
        entry.videoUrl,
        'imageUrl',
        entry.imageUrl,
        'etag',
        entry.etag,
        'publishedAt',
        entry.publishedAt,
        'publishedAtTimestamp',
        parseInt(entry.publishedAtTimestamp),
        'price',
        parseInt(entry.price),
        'forSale',
        entry.forSale,
        'equityForSale',
        parseInt(entry.equityForSale),
        'artist',
        entry.artist
      )
      .sadd(`${key}`, entry.id)
      .exec(async (err) => {
        if (err) {
          console.log(err);
          return reject();
        }
        const totalEntries = await scard(key);
        return resolve(totalEntries);
      });
  });
}

const createEntry = {
  type: Entry,
  args: {
    image: {
      type: new GraphQLNonNull(GraphQLUpload),
    },
    video: {
      type: new GraphQLNonNull(GraphQLUpload),
    },
    description: {
      type: new GraphQLNonNull(GraphQLString),
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artist: {
      type: new GraphQLNonNull(GraphQLString),
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    forSale: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    price: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    equityForSale: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
  async resolve(
    _: any,
    {
      image,
      video,
      description,
      title,
      artist,
      id,
      forSale,
      price,
      equityForSale,
    }: any,
    ctx: any
  ) {
    let user = await getAuthenticatedUser(ctx);

    const [
      { mimetype: videoMimetype, createReadStream: videoCreateReadStream },
      { mimetype: imgMimetype, createReadStream: imgCreateReadStream },
    ] = [await video, await image];

    const name = `${artist} - ${title}`;

    const {
      code,
      issuer,
      xdr,
      image: imageIpfs,
      video: videoIpfs,
    } = await buildNFT(
      '',
      {
        name: name,
        description: description,
        code: `${title}${artist}`
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/ /g, '')
          .replace(/-/g, '')
          .replace(/[^0-9a-z]/gi, '')
          .substr(0, 12)
          .toUpperCase(),
        domain: 'skyhitz.io',
        supply: 1,
      },
      { imgMimetype, imgCreateReadStream },
      { videoMimetype, videoCreateReadStream }
    );

    let entry = {
      id: id,
      imageUrl: imageIpfs,
      description: description,
      title: title,
      artist: artist,
      videoUrl: videoIpfs,
      publishedAt: new Date().toISOString(),
      publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
      forSale: forSale,
      price: price,
      equityForSale: equityForSale,
    };

    const testing = user.testing === 'true';

    let entryIndex: any = entry;
    entryIndex.userDisplayName = user.displayName;
    entryIndex.userUsername = user.username;
    entryIndex.objectID = id;
    entryIndex.testing = testing;

    const [totalEntries, , { publicAddress, seed }] = [
      await setEntry(entry, testing),
      await entriesIndex.addObject(entryIndex),
      await checkPaymentsAccount(entry.forSale, user.email),
    ];

    // create offer to sale for equity percentage. Match asset id with entry id
    if (publicAddress && forSale) {
      const assetCode = generateAssetCode(totalEntries);
      await issueAssetAndOpenSellOffer(
        seed,
        assetCode,
        equityForSale,
        price / equityForSale
      );
      await mapAssetIdToEntryId(entry, testing, assetCode);
    }

    return entry;
  },
};

export default createEntry;
