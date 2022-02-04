import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
} from 'graphql';

import { getAuthenticatedUser } from '../auth/logic';
import { entriesIndex } from '../algolia/algolia';
import { openSellOffer } from '../stellar/operations';
import { scard, redisClient, getAll } from '../redis';
import { buildNFTTransaction } from '../stellar/index';
import XDR from './types/xdr';
import { Keypair } from 'skyhitz-stellar-base';
import { generateTomlFile } from '../stellar/toml';

async function mapAssetIdToEntryId(entry, assetCode) {
  let key = 'all-assets';

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

async function setEntry(entry, toml): Promise<number> {
  let key = 'all-entries';
  console.log('entry', entry);
  return new Promise((resolve, reject) => {
    redisClient
      .multi()
      .hmset(`toml:${entry.id.substr(0, 12)}`, 'toml', toml)
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
      user.publicKey,
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

    let entryIndex: any = entry;
    entryIndex.userDisplayName = user.displayName;
    entryIndex.userUsername = user.username;
    entryIndex.objectID = cid;

    await Promise.all([
      await setEntry(
        entry,
        generateTomlFile({
          code,
          issuer: issuerKey.publicKey(),
          description,
          name: `${artist} - ${title}`,
          image: imageUrl,
          supply,
        })
      ),
      await entriesIndex.addObject(entryIndex),
    ]);

    if (user.publicKey && forSale) {
      const sellXdr = await openSellOffer(
        transaction,
        issuerKey,
        code,
        user.publicKey,
        equityForSale,
        price / equityForSale
      );
      await mapAssetIdToEntryId(entry, code);
      return sellXdr;
    }

    return xdr;
  },
};

export default createEntry;
