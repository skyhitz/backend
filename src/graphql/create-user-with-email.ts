import UniqueIdGenerator from '../auth/unique-id-generator';
import { getByUsernameOrEmailOrPublicKey, saveUser } from '../algolia/algolia';
import { sendWelcomeEmail } from '../sendgrid/sendgrid';
import { createAndFundAccount } from '../stellar/operations';
import { encrypt } from '../util/encryption';
import { User } from '../util/types';
import { getAccount, getConfig } from '../stellar/utils';
import { verifySourceSignatureOnXDR } from '../stellar';
import * as jwt from 'jsonwebtoken';
import { Config } from '../config';
import { GraphQLError } from 'graphql';

export const createUserWithEmailResolver = async (
  _: any,
  args: any,
  ctx: any
) => {
  const { displayName, email, username, signedXDR } = args;
  if (!email) {
    throw new GraphQLError(`Email can't be an empty string`);
  }
  if (!username) {
    throw new GraphQLError(`Username can't be an empty string`);
  }

  // TODO: Make a proper fix
  const usernameLowercase = username.toLowerCase();

  // check if the provided signedXDR is valid and obtain publicKey
  let publicKey;
  if (signedXDR) {
    const { verified, source } = verifySourceSignatureOnXDR(signedXDR);
    if (!verified) {
      throw new GraphQLError('Invalid signed XDR');
    }
    publicKey = source;
  }

  const res = await getByUsernameOrEmailOrPublicKey(
    usernameLowercase,
    email,
    publicKey
  );
  if (res && res.email === email) {
    throw new GraphQLError('Email already exists, please sign in.');
  }
  if (res && res.username === usernameLowercase) {
    throw new GraphQLError('Username is taken.');
  }
  if (res && res.publicKey === publicKey) {
    throw new GraphQLError(
      'Public Key is connected to another account, please sign in.'
    );
  }

  // check if provided publicKey account exists on stellar
  if (publicKey) {
    try {
      await getAccount(publicKey);
    } catch {
      throw new GraphQLError(
        `Provided public key does not exist on the Stellar ${
          getConfig().network
        } network. It must be created before it can be used to submit transactions.`
      );
    }
  }

  const newId = UniqueIdGenerator.generate();

  let user: User = {
    avatarUrl: '',
    displayName: displayName,
    description: '',
    username: usernameLowercase,
    email: email,
    version: 1,
    publishedAt: new Date().toISOString(),
    publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
    publicKey: publicKey,
    objectID: newId,
    id: newId,
    seed: '',
    lastPlayedEntry: null,
  };

  try {
    // create and sponsor a stellar account for the user if they don't have one yet
    if (!user.publicKey) {
      let { publicAddress, secret } = await createAndFundAccount();
      let seed = encrypt(secret);
      user.publicKey = publicAddress;
      user.seed = seed;
    }

    await saveUser(user);
    sendWelcomeEmail(user.email);

    // if the user already provided signedXDR and it was valid
    // we can log in him already.
    // otherwise user has to log in via email.
    if (signedXDR) {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          version: user.version,
        } as any,
        Config.JWT_SECRET
      );
      user.jwt = token;
      ctx.user = Promise.resolve(user);
      return {
        message: 'User created. You logged in successfully.',
        user,
      };
    } else {
      return { message: 'User created.' };
    }
  } catch (e) {
    throw new GraphQLError('There was an error during user creation');
  }
};
