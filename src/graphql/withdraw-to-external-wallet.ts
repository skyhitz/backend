import { GraphQLString, GraphQLInt, GraphQLNonNull } from 'graphql';
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

    const { seed, publicAddress } = user;

    if (!seed) {
      return {
        success: false,
        message: 'Withdraw is only available for custodial accounts',
      };
    }

    try {
      const { availableCredits: currentBalance } = await accountCredits(
        publicAddress
      );

      if (amount > currentBalance) {
        return { success: false, message: 'Your account balance is too low.' };
      }

      console.log(
        `withdrawal to address ${address}, amount ${amount.toFixed(6)}`
      );
      await withdrawToExternalAddress(address, amount, seed);
      return { success: true, message: 'OK' };
    } catch (e) {
      console.log(`error`, e);
      return { success: false, message: 'Unexpected error during withdrawal.' };
    }
  },
};
