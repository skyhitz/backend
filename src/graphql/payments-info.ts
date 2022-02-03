import { getAuthenticatedUser } from '../auth/logic';
import { findCustomer } from '../payments/stripe';
import PaymentsInfoObject from './types/payments-info';
import { accountCredits } from '../stellar/operations';

const PaymentsInfo = {
  type: PaymentsInfoObject,
  async resolve(root: any, args: any, ctx: any) {
    let user;
    let customer;
    try {
      user = await getAuthenticatedUser(ctx);
    } catch (e) {
      return {
        subscribed: false,
        credits: 0,
      };
    }

    try {
      customer = await findCustomer(user.email);
      if (!customer) {
        if (user.publicKey) {
          let credits = await accountCredits(user.publicKey);
          return {
            subscribed: false,
            credits: credits,
          };
        }

        return {
          subscribed: false,
          credits: 0,
        };
      }
      let credits = await accountCredits(customer.metadata.publicAddress);

      let subscriptions = customer.subscriptions.data;

      if (subscriptions.length > 0) {
        return {
          subscribed: true,
          credits: credits,
        };
      }
      return {
        subscribed: false,
        credits: credits,
      };
    } catch (e) {
      return {
        subscribed: false,
        credits: 0,
      };
    }
  },
};

export default PaymentsInfo;
