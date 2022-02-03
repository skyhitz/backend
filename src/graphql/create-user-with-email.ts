import { GraphQLString, GraphQLNonNull } from 'graphql';

import User from './types/user';
import UniqueIdGenerator from '../auth/unique-id-generator';
import * as jwt from 'jsonwebtoken';
import { Config } from '../config';
import { usersIndex } from '../algolia/algolia';
import { setUser, smembers } from '../redis';
import { sendWelcomeEmail } from '../sendgrid/sendgrid';
import { createAndFundAccount } from '../stellar/operations';
import { encrypt } from '../util/encryption';
import { AlgoliaUserObject, UserPayload } from '../util/types';

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

    let userPayload: UserPayload = {
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
      seed: '',
    };

    // create and sponsor a stellar account for the user if they don't have one yet
    if (!userPayload.publicKey) {
      try {
        let { publicAddress, secret } = await createAndFundAccount();
        let seed = encrypt(secret);
        userPayload.publicKey = publicAddress;
        userPayload.seed = seed;
      } catch (e) {
        throw e;
      }
    }
    let user: any = await setUser(userPayload);

    const { id, email, version } = user;
    const token = jwt.sign({ id, email, version } as any, Config.JWT_SECRET);
    user.jwt = token;
    ctx.user = Promise.resolve(user);
    let userIndexObject: AlgoliaUserObject = {
      avatarUrl: null,
      displayName: userPayload.displayName,
      description: null,
      username: userPayload.username,
      id: userPayload.id,
      publishedAt: userPayload.publishedAt,
      publishedAtTimestamp: userPayload.publishedAtTimestamp,
      objectID: userPayload.id,
      publicKey: userPayload.publicKey,
    };
    await usersIndex.addObject(userIndexObject);
    sendWelcomeEmail(email);
    return user;
  },
};

export default createUserWithEmail;
