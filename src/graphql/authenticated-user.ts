import { getAuthenticatedUser } from '../auth/logic';

export const authenticatedUserResolver = async (
  root: any,
  args: any,
  ctx: any
) => {
  const user = await getAuthenticatedUser(ctx);
  return user;
};
