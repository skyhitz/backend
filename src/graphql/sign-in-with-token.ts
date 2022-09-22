import { GraphQLString, GraphQLNonNull } from 'graphql';
import GraphQLUser from './types/user';
import passwordless from '../passwordless/passwordless';
import * as jwt from 'jsonwebtoken';
import { Config } from '../config';
import { getUser } from '../algolia/algolia';

const SignInWithToken = {
  type: GraphQLUser,
  args: {
    token: {
      type: new GraphQLNonNull(GraphQLString),
    },
    uid: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { token: graphQLToken, uid }: any, ctx: any) {
    return new Promise((resolve, reject) => {
      passwordless._tokenStore.authenticate(
        graphQLToken,
        uid,
        async function (error, valid, referrer) {
          if (valid) {
            let user = await getUser(uid);

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
            // Invalidate token, except allowTokenReuse has been set
            if (!passwordless._allowTokenReuse) {
              passwordless._tokenStore.invalidateUser(uid, function (err) {
                if (err) {
                  throw 'TokenStore.invalidateUser() error: ' + error;
                } else {
                  resolve(user);
                }
              });
            } else {
              resolve(user);
            }
          } else {
            resolve(null);
          }
        }
      );
    });
  },
};

export default SignInWithToken;
