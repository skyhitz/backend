import { GraphQLString, GraphQLNonNull } from 'graphql';

import UniqueIdGenerator from '../auth/unique-id-generator';
import { getByUsernameOrEmailOrPublicKey, saveUser } from '../algolia/algolia';
import { sendWelcomeEmail } from '../sendgrid/sendgrid';
import { createAndFundAccount } from '../stellar/operations';
import { encrypt } from '../util/encryption';
import { User } from '../util/types';
import SuccessResponse from './types/success-response';

const createUserWithEmail = {
  type: SuccessResponse,
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
    if (!args.email) {
      throw `Email can't be an empty string`;
    }
    if (!args.username) {
      throw `Username can't be an empty string`;
    }

    // TODO: Make a proper fix
    args.username = args.username.toLowerCase();

    const res = await getByUsernameOrEmailOrPublicKey(
      args.username,
      args.email,
      args.publicKey
    );
    if (res && res.email === args.email) {
      throw 'Email already exists, please sign in.';
    }
    if (res && res.username === args.username) {
      throw 'Username is taken.';
    }
    if (res && res.publicKey === args.publicKey) {
      throw 'Public Key is connected to another account, please sign in.';
    }

    const newId = UniqueIdGenerator.generate();

    let user: User = {
      avatarUrl: '',
      displayName: args.displayName,
      description: '',
      username: args.username,
      email: args.email,
      version: 1,
      publishedAt: new Date().toISOString(),
      publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
      publicKey: args.publicKey,
      objectID: newId,
      id: newId,
      seed: '',
      lastPlayedEntry: null,
    };

    // create and sponsor a stellar account for the user if they don't have one yet
    if (!user.publicKey) {
      try {
        let { publicAddress, secret } = await createAndFundAccount();
        let seed = encrypt(secret);
        user.publicKey = publicAddress;
        user.seed = seed;
      } catch (e) {
        throw e;
      }
    }

    await saveUser(user);
    sendWelcomeEmail(user.email);

    return { success: true, message: 'User created.' };
  },
};

export default createUserWithEmail;
