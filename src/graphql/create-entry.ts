import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
} from 'graphql';

import { getAuthenticatedUser } from '../auth/logic';
import { entriesIndex } from '../algolia/algolia';
// import { checkIfEntryOwnerHasStripeAccount } from '../payments/subscription';
import { openSellOffer } from '../stellar/operations';
import { scard, redisClient, getAll } from '../redis';
import { buildNFTTransaction } from '../stellar/index';
import XDR from './types/xdr';
import { Keypair } from 'skyhitz-stellar-base';
import { generateTomlFile } from '../stellar/toml';

// async function checkPaymentsAccount(forSale: boolean, email: string) {
//   if (forSale) {
//     try {
//       return await checkIfEntryOwnerHasStripeAccount(email);
//     } catch (e) {
//       console.log(e);
//       throw 'could not check if entry owner has stripe account';
//     }
//   }
//   return;
// }

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

async function setEntry(entry, testing, toml): Promise<number> {
  let key = testing ? 'testing:all-entries' : 'all-entries';
  console.log('entry', entry);
  return new Promise((resolve, reject) => {
    redisClient
      .multi()
      .hmset(`toml:${entry.id}`, 'toml', toml)
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
        entry.artist,
        'code',
        entry.code,
        'issuer',
        entry.issuer
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
  type: XDR,
  args: {
    cid: {
      type: new GraphQLNonNull(GraphQLString),
    },
    imageUrl: {
      type: new GraphQLNonNull(GraphQLString),
    },
    videoUrl: {
      type: new GraphQLNonNull(GraphQLString),
    },
    code: {
      type: new GraphQLNonNull(GraphQLString),
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
    forSale: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    price: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    equityForSale: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
  },
  async resolve(
    _: any,
    {
      cid,
      imageUrl,
      videoUrl,
      code,
      description,
      title,
      artist,
      forSale,
      price,
      equityForSale,
    }: any,
    ctx: any
  ) {
    let user = await getAuthenticatedUser(ctx);

    const issuer = await getAll(`issuer:${user.id}`);
    if (!issuer) {
      throw 'issuer not set';
    }
    const issuerKey = Keypair.fromSecret(issuer.seed);
    const supply = 1;

    const { transaction, xdr } = await buildNFTTransaction(
      user.pk,
      issuerKey,
      code,
      supply,
      cid
    );

    let entry = {
      id: cid,
      imageUrl: imageUrl,
      description: description,
      title: title,
      artist: artist,
      videoUrl: videoUrl,
      publishedAt: new Date().toISOString(),
      publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
      forSale: forSale,
      price: price,
      equityForSale: equityForSale,
      code: code,
      issuer: issuerKey.publicKey(),
    };

    const testing = user.testing === 'true';

    let entryIndex: any = entry;
    entryIndex.userDisplayName = user.displayName;
    entryIndex.userUsername = user.username;
    entryIndex.objectID = cid;
    entryIndex.testing = testing;

    await Promise.all([
      await setEntry(
        entry,
        testing,
        generateTomlFile({
          code,
          issuer,
          description,
          name: `${artist} - ${title}`,
          image: imageUrl,
          supply,
        })
      ),
      await entriesIndex.addObject(entryIndex),
      // await checkPaymentsAccount(entry.forSale, user.email),
    ]);

    // create offer to sale for equity percentage. Match asset id with entry id
    if (user.pk && forSale) {
      const sellXdr = await openSellOffer(
        transaction,
        issuerKey,
        code,
        user.pk,
        equityForSale,
        price / equityForSale
      );
      await mapAssetIdToEntryId(entry, testing, code);
      return sellXdr;
    }

    return xdr;
  },
};

export default createEntry;
