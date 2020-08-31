import { GraphQLString, GraphQLNonNull, GraphQLBoolean } from 'graphql';

import User from './types/user';
import UniqueIdGenerator from '../auth/unique-id-generator';
import { generateHash } from '../auth/bycrypt';
import * as jwt from 'jsonwebtoken';
import { Config } from '../config';
import { usersIndex } from '../algolia/algolia';
import { redisClient } from '../redis';

function setUser(user) {
  let key = user.testing ? 'testing:all-users' : 'all-users';

  return new Promise((resolve, reject) => {
    redisClient
      .multi()
      .hmset(
        `users:${user.id}`,
        'avatarUrl',
        user.avatarUrl,
        'displayName',
        user.displayName,
        'email',
        user.email,
        'publishedAt',
        user.publishedAt,
        'username',
        user.username.toLowerCase(),
        'id',
        user.id,
        'password',
        user.password,
        'version',
        user.version,
        'resetPasswordToken',
        user.resetPasswordToken,
        'resetPasswordExpires',
        user.resetPasswordExpires,
        'description',
        user.description,
        'phone',
        user.phone,
        'testing',
        user.testing,
        'publishedAtTimestamp',
        user.publishedAtTimestamp
      )
      .sadd(`usernames:${user.username.toLowerCase()}`, user.id)
      .sadd(`emails:${user.email}`, user.id)
      .sadd(key, user.id)
      .exec((err) => {
        if (err) {
          return reject(err);
        }
        resolve(user);
      });
  });
}

const createUserWithEmail = {
  type: User,
  args: {
    displayName: {
      type: new GraphQLNonNull(GraphQLString),
    },
    email: {
      type: new GraphQLNonNull(GraphQLString),
    },
    username: {
      type: new GraphQLNonNull(GraphQLString),
    },
    password: {
      type: new GraphQLNonNull(GraphQLString),
    },
    testing: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  },
  async resolve(_: any, args: any, ctx: any) {
    let passwordHash = await generateHash(args.password);
    let userPayload: any = {
      avatarUrl: '',
      displayName: args.displayName,
      description: '',
      email: args.email,
      password: passwordHash,
      username: args.username,
      id: UniqueIdGenerator.generate(),
      version: 1,
      publishedAt: new Date().toISOString(),
      publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
      phone: '',
      testing: args.testing ? true : false,
      resetPasswordToken: '',
      resetPasswordExpires: '',
    };
    let user: any = await setUser(userPayload);

    const { id, email, version } = user;
    const token = jwt.sign({ id, email, version } as any, Config.JWT_SECRET);
    user.jwt = token;
    ctx.user = Promise.resolve(user);
    let userIndexObject: any = {
      avatarUrl: null,
      displayName: userPayload.displayName,
      description: null,
      username: userPayload.username,
      id: userPayload.id,
      publishedAt: userPayload.publishedAt,
      publishedAtTimestamp: userPayload.publishedAtTimestamp,
      objectID: userPayload.id,
      testing: userPayload.testing,
    };
    await usersIndex.addObject(userIndexObject);

    return user;
  },
};

export default createUserWithEmail;
