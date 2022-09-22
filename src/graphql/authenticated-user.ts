import User from './types/user';
import { getAuthenticatedUser } from '../auth/logic';

const AuthenticatedUser = {
  type: User,
  async resolve(root: any, args: any, ctx: any) {
    const user = await getAuthenticatedUser(ctx);
    return user;
  },
};

export default AuthenticatedUser;
