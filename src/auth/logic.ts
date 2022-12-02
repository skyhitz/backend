import { GraphQLError } from 'graphql';
import { getUser } from '../algolia/algolia';

export async function getAuthenticatedUser(ctx: any) {
  const user = await ctx.user;
  if (!user) {
    throw new GraphQLError('Unauthorized User');
  }
  const algoliaUser = await getUser(user.id);

  return { ...user, ...algoliaUser };
}
