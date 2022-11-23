import { likeMulti, unlikeMulti } from '../algolia/algolia';
import { getAuthenticatedUser } from '../auth/logic';

export const likeEntryResolver = async (
  _: any,
  { id, like }: any,
  ctx: any
) => {
  let user = await getAuthenticatedUser(ctx);
  if (like) {
    return likeMulti(user.id, id);
  }
  return unlikeMulti(user.id, id);
};
