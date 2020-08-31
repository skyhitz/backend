import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql';
import Entry from './types/entry';
import { getAuthenticatedUser } from '../auth/logic';
import { entriesIndex } from '../algolia/algolia';
import { checkIfEntryOwnerHasStripeAccount } from '../payments/subscription';
import { redisClient } from '../redis';

async function checkPaymentsAccount(forSale: boolean, email: string) {
  if (forSale) {
    try {
      await checkIfEntryOwnerHasStripeAccount(email);
    } catch (e) {
      console.log(e);
      throw 'could not check if entry owner has stripe account';
    }
    return;
  }
  return;
}

async function setEntry(entry, testing, userId) {
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
        'youtubeId',
        null,
        'price',
        parseInt(entry.price),
        'forSale',
        entry.forSale,
        'artist',
        entry.artist
      )
      .sadd(`${key}`, entry.id)
      .hmset(`owners:entry:${entry.id}`, userId, 1)
      .hmset(`owners:user:${userId}`, entry.id, 1)
      .exec((err) => {
        if (err) {
          return reject();
        }
        return resolve();
      });
  });
}

const createEntry = {
  type: Entry,
  args: {
    etag: {
      type: new GraphQLNonNull(GraphQLString),
    },
    imageUrl: {
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
    videoUrl: {
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
  },
  async resolve(_: any, args: any, ctx: any) {
    let user = await getAuthenticatedUser(ctx);
    let {
      etag,
      imageUrl,
      description,
      title,
      artist,
      videoUrl,
      id,
      forSale,
      price,
    } = args;
    let entry = {
      id: id,
      etag: etag,
      imageUrl: imageUrl,
      description: description,
      title: title,
      artist: artist,
      videoUrl: videoUrl,
      publishedAt: new Date().toISOString(),
      publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
      forSale: forSale,
      price: price,
    };

    await setEntry(entry, user.testing, user.id);

    let entryIndex: any = entry;
    entryIndex.userDisplayName = user.displayName;
    entryIndex.userUsername = user.username;
    entryIndex.objectID = id;
    entryIndex.testing = user.testing;
    [
      await entriesIndex.addObject(entryIndex),
      await checkPaymentsAccount(entry.forSale, user.email),
    ];
  },
};

export default createEntry;
