import { getAuthenticatedUser } from '../auth/logic';

export const authenticatedUserResolver = async (
  _root: any,
  _args: any,
  ctx: any
) => {
  const user = await getAuthenticatedUser(ctx);
  return { ...user, managed: user.seed !== '' };
};
