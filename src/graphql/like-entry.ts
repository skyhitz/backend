import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { redisClient, getAll } from '../redis';

async function likeMulti(userId, entryId) {
  let { likesCount } = await getAll(`entries:${entryId}`);
  let likeCountNumber = parseInt(likesCount) + 1;
  return new Promise((resolve, reject) => {
    redisClient
      .multi()
      .sadd(`likes:user:${userId}`, entryId)
      .sadd(`likes:entry:${entryId}`, userId)
      .hset(`entry:${entryId}`, 'likeCount', likeCountNumber.toString())
      .exec((err) => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
  });
}

async function unlikeMulti(userId, entryId) {
  let { likesCount } = await getAll(`entries:${entryId}`);
  let likeCountNumber = parseInt(likesCount) - 1;
  return new Promise((resolve, reject) => {
    redisClient
      .multi()
      .srem(`likes:user:${userId}`, entryId)
      .srem(`likes:entry:${entryId}`, userId)
      .hset(`entry:${entryId}`, 'likeCount', likeCountNumber.toString())
      .exec((err) => {
        if (err) {
          return reject(err);
        }
        resolve(true);
      });
  });
}

const likeEntry = {
  type: GraphQLBoolean,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    like: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
  async resolve(_: any, { id, like }: any, ctx: any) {
    let user = await getAuthenticatedUser(ctx);
    if (like) {
      return likeMulti(user.id, id);
    }
    return unlikeMulti(user.id, id);
  },
};

export default likeEntry;
