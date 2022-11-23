import { getAuthenticatedUser } from '../auth/logic';
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
        credits: 0,
      };
    }

    const { availableCredits: credits } = await accountCredits(user.publicKey);

    return {
      credits: credits,
    };
  },
};

export default PaymentsInfo;
