import { GraphQLString, GraphQLNonNull } from 'graphql';
import { GraphQLUser } from './types/user';
import { verifySourceSignatureOnXDR } from '../stellar';
import { accountCredits, withdrawAndMerge } from '../stellar/operations';
import { getAuthenticatedUser } from '../auth/logic';
import { decrypt } from '../util/encryption';
import { getUserByPublicKey, usersIndex } from '../algolia/algolia';

const ChangeWallet = {
  type: GraphQLUser,
  args: {
    signedXDR: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { signedXDR }: any, ctx: any) {
    const user = await getAuthenticatedUser(ctx);
    const { verified, source: newPublicKey } =
      verifySourceSignatureOnXDR(signedXDR);
    if (!verified) {
      throw 'Invalid signed XDR';
    }

    if (user.publicKey === newPublicKey) {
      throw 'User already has this public key';
    }

    try {
      await getUserByPublicKey(newPublicKey);
      throw 'User with this public key already exists';
    } catch (ex) {
      // it means there is no user with such public key
    }

    // user has a custodial account. We need to transfer his funds to the new wallet and merge with stellar account
    if (user.seed) {
      try {
        const { availableCredits } = await accountCredits(user.publicKey);

        console.log(
          `withdrawal to address ${newPublicKey}, amount ${availableCredits.toFixed(
            6
          )}`
        );
        const decryptedSeed = decrypt(user.seed);
        await withdrawAndMerge(newPublicKey, availableCredits, decryptedSeed);
      } catch (e) {
        console.log(`error`, e);
        if (typeof e === 'string') {
          throw e;
        }
        throw 'Unexpected error during change wallet procedure.';
      }
    }

    // now we need to update publicKey in algolia object
    const userUpdate = {
      ...user,
      publicKey: newPublicKey,
      seed: '',
    };
    await usersIndex.partialUpdateObject(userUpdate);
    return userUpdate;
  },
};

export default ChangeWallet;
