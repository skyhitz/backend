import { GraphQLString, GraphQLNonNull } from 'graphql';
import { GraphQLUser } from './types/user';
import * as jwt from 'jsonwebtoken';
import { Config } from '../config';
import { getUserByPublicKey } from '../algolia/algolia';
import { verifySourceSignatureOnXDR } from '../stellar';

const SignInWithXDR = {
  type: GraphQLUser,
  args: {
    signedXDR: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { signedXDR }: any, ctx: any) {
    const { verified, source } = verifySourceSignatureOnXDR(signedXDR);
    if (!verified) {
      throw 'Invalid signed XDR';
    }

    const user = await getUserByPublicKey(source);
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        version: user.version,
      } as any,
      Config.JWT_SECRET
    );
    user.jwt = token;
    ctx.user = Promise.resolve(user);

    return user;
  },
};

export default SignInWithXDR;
