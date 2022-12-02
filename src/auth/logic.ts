import { User } from '../util/types';
import { getUser } from '../algolia/algolia';

export async function getAuthenticatedUser(ctx: any): Promise<User> {
  const user = await ctx.user;
  if (!user) {
    throw 'Unauthorized User';
  }
  const algoliaUser = await getUser(user.id);

  return { ...user, ...algoliaUser };
}
