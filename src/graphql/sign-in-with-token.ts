import passwordless from '../passwordless/passwordless';
import * as jwt from 'jsonwebtoken';
import { Config } from '../config';
import { getUser } from '../algolia/algolia';
import { GraphQLError } from 'graphql';

export const signInWithTokenResolver = async (
  _: any,
  { token: graphQLToken, uid }: any,
  ctx: any
) => {
  if (
    graphQLToken === Config.DEMO_ACCOUNT_TOKEN &&
    uid === Config.DEMO_ACCOUNT_UID
  ) {
    const user = await getUser(uid);

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
  }
  return new Promise(async (resolve, reject) => {
    try {
      await passwordless._tokenStore.authenticate(
        graphQLToken,
        uid,
        async function (error, valid) {
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
                  throw new GraphQLError(
                    'TokenStore.invalidateUser() error: ' + error
                  );
                } else {
                  resolve(user);
                }
              });
            } else {
              resolve(user);
            }
          } else {
            reject(new GraphQLError('Provided link is not valid'));
          }
        }
      );
    } catch (ex) {
      console.log(ex);
      reject(new GraphQLError('Provided link is not valid'));
    }
  });
};
