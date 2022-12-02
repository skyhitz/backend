import { getAuthenticatedUser } from '../auth/logic';
import { getEntriesLikesWithUserId } from '../algolia/algolia';

export const userLikesResolver = async (_: any, _args: any, ctx: any) => {
  const user = await getAuthenticatedUser(ctx);

  const entriesArr = await getEntriesLikesWithUserId(user.id);

  return entriesArr;
};
