import { getAuthenticatedUser } from '../auth/logic';
import { hideBid } from '../algolia/algolia';
import { GraphQLError } from 'graphql';

export const hideBidResolver = async (_: any, args: any, ctx: any) => {
  const { id } = args;

  const user = await getAuthenticatedUser(ctx);

  try {
    await hideBid(id, user.publicKey);
    return;
  } catch (ex) {
    throw new GraphQLError(ex);
  }
};
