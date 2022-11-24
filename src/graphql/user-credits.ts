import { getAuthenticatedUser } from '../auth/logic';
import { accountCredits } from '../stellar/operations';

export const userCreditsResolver = async (_root: any, _args: any, ctx: any) => {
  let user;
  try {
    user = await getAuthenticatedUser(ctx);
  } catch (e) {
    return 0;
  }

  const { availableCredits: credits } = await accountCredits(user.publicKey);

  return credits;
};
