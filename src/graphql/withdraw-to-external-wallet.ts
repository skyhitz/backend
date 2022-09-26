import { GraphQLString, GraphQLInt, GraphQLNonNull } from 'graphql';
import { decrypt } from 'src/util/encryption';
import { getAuthenticatedUser } from '../auth/logic';
import {
  accountCredits,
  withdrawToExternalAddress,
} from '../stellar/operations';
import SuccessResponse from './types/success-response';

/**
 * Withdraws user balance to external address in XLM
 */
export default {
  type: SuccessResponse,
  args: {
    address: {
      type: new GraphQLNonNull(GraphQLString),
    },
    amount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
  async resolve(_: any, { address, amount }: any, ctx: any) {
    const user = await getAuthenticatedUser(ctx);

    const { seed, publicKey } = user;

    if (!seed) {
      throw 'Withdraw is only available for custodial accounts';
    }

    try {
      const { availableCredits: currentBalance } = await accountCredits(
        publicKey
      );

      if (amount > currentBalance) {
        throw 'Your account balance is too low.';
      }

      console.log(
        `withdrawal to address ${address}, amount ${amount.toFixed(6)}`
      );
      const decryptedSeed = decrypt(seed);
      await withdrawToExternalAddress(address, amount, decryptedSeed);
      return { success: true, message: 'OK' };
    } catch (e) {
      console.log(`error`, e);
      if (typeof e === 'string') {
        throw e;
      }
      throw 'Unexpected error during withdrawal.';
    }
  },
};
