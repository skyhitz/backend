import { GraphQLError } from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { accountCredits } from '../stellar/operations';

export const userCreditsResolver = async (_root: any, _args: any, ctx: any) => {
  const user = await getAuthenticatedUser(ctx);

  try {
    const { availableCredits: credits } = await accountCredits(user.publicKey);

    return credits;
  } catch (_) {
    throw new GraphQLError('Could not fetch account credits');
  }
};
