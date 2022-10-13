import { getUser } from 'src/algolia/algolia';

export async function getAuthenticatedUser(ctx: any) {
  const user = await ctx.user;
  if (!user) {
    throw 'Unauthorized User';
  }
  const algoliaUser = await getUser(user.id);

  return { ...user, ...algoliaUser };
}
