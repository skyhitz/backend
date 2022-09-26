import { GraphQLUser } from './types/user';
import { getAuthenticatedUser } from '../auth/logic';

const AuthenticatedUser = {
  type: GraphQLUser,
  async resolve(root: any, args: any, ctx: any) {
    const user = await getAuthenticatedUser(ctx);
    return user;
  },
};

export default AuthenticatedUser;
