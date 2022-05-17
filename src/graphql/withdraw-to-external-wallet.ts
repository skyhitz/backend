import {
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLNonNull,
} from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { findCustomer } from '../payments/stripe';
import {
  accountCredits,
  withdrawToExternalAddress,
} from '../stellar/operations';

/**
 * Withdraws user balance to external address in XLM
 */
export default {
  type: GraphQLBoolean,
  args: {
    address: {
      type: new GraphQLNonNull(GraphQLString),
    },
    amount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
  async resolve(_: any, { address, amount }: any, ctx: any) {
    let user = await getAuthenticatedUser(ctx);

    const { metadata } = await findCustomer(user.email);
    if (!metadata) {
      return false;
    }
    const { seed, publicAddress } = metadata;

    const { availableCredits: currentBalance } = await accountCredits(
      publicAddress
    );

    if (amount > currentBalance) {
      return false;
    }

    try {
      console.log(
        `withdrawal to address ${address}, amount ${amount.toFixed(6)}`
      );
      await withdrawToExternalAddress(address, amount, seed);
      return true;
    } catch (e) {
      console.log(`error`, e);
      return false;
    }
  },
};
