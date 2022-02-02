import { GraphQLString, GraphQLNonNull } from 'graphql';

import User from './types/user';
import UniqueIdGenerator from '../auth/unique-id-generator';
import * as jwt from 'jsonwebtoken';
import { Config } from '../config';
import { usersIndex } from '../algolia/algolia';
import { redisClient, smembers } from '../redis';
import { sendGridService } from '../sendgrid/sendgrid';

function setUser(user) {
  let key = 'all-users';

  return new Promise((resolve, reject) => {
    if (user.publicKey) {
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
          'version',
          user.version,
          'description',
          user.description,
          'publishedAtTimestamp',
          user.publishedAtTimestamp,
          'publicKey',
          user.publicKey
        )
        .sadd(`usernames:${user.username.toLowerCase()}`, user.id)
        .sadd(`emails:${user.email}`, user.id)
        .sadd(`publicKeys:${user.publicKey}`, user.publicKey)
        .sadd(key, user.id)
        .exec((err) => {
          if (err) {
            return reject(err);
          }
          resolve(user);
        });
    } else {
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
          'version',
          user.version,
          'description',
          user.description,
          'publishedAtTimestamp',
          user.publishedAtTimestamp,
          'publicKey',
          ''
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
    }
  });
}

function sendWelcomeEmail(email) {
  const msg = {
    to: email,
    from: 'alejandro@skyhitzmusic.com',
    subject: 'Welcome to Skyhitz',
    html: `<p>Hi,
        <br><p>Thanks for joining Skyhitz, we are on a mission to encourage music creation and production around the world.<br>
        <br>
        <br><br>If you did not sign up for an account, please send us an email.
        <br>
        <br><br>Keep making music, <br>Skyhitz Team</p>`,
  };
  sendGridService.sendEmail(msg);
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
    publicKey: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, args: any, ctx: any) {
    let [[emailId], [usernameId], [publicKeyId]] = [
      await smembers(`emails:${args.email}`),
      await smembers(`usernames:${args.username}`),
      await smembers(`publicKeys:${args.publicKey}`),
    ];
    if (emailId) {
      throw 'Email already exists, please sign in.';
    }
    if (usernameId) {
      throw 'Username is taken.';
    }
    if (publicKeyId) {
      throw 'Public Key is connected to another account, please sign in.';
    }

    let userPayload: any = {
      avatarUrl: '',
      displayName: args.displayName,
      description: '',
      email: args.email,
      username: args.username,
      id: UniqueIdGenerator.generate(),
      version: 1,
      publishedAt: new Date().toISOString(),
      publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
      publicKey: args.publicKey,
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
    };
    await usersIndex.addObject(userIndexObject);
    sendWelcomeEmail(email);
    return user;
  },
};

export default createUserWithEmail;
