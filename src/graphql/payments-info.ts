import { getAuthenticatedUser } from '../auth/logic';
import { findCustomer } from '../payments/stripe';
import PaymentsInfoObject from './types/payments-info';
import { accountCredits } from '../stellar/operations';

const PaymentsInfo = {
  type: PaymentsInfoObject,
  async resolve(root: any, args: any, ctx: any) {
    let user;
    try {
      user = await getAuthenticatedUser(ctx);
    } catch (e) {
      return {
        subscribed: false,
        credits: 0,
      };
    }

    const [customer, { availableCredits: credits }] = await Promise.all([
      await findCustomer(user.email),
      await accountCredits(user.publicKey),
    ]);

    if (customer) {
      const { subscriptions } = customer;

      return {
        credits: credits,
        subscribed:
          subscriptions && subscriptions.data
            ? subscriptions.data.length > 0
            : false,
      };
    }

    return {
      credits: credits,
      subscribed: false,
    };
  },
};

export default PaymentsInfo;
