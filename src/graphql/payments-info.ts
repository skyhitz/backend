import { getAuthenticatedUser } from '../auth/logic';
import { accountCredits } from '../stellar/operations';

export const paymentsInfoResolver = async (root: any, args: any, ctx: any) => {
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
};
