import * as jwt from 'jsonwebtoken';
import { Config } from '../config';
import { getUserByPublicKey } from '../algolia/algolia';
import { verifySourceSignatureOnXDR } from '../stellar';
import { GraphQLError } from 'graphql';

export const signInWithXDRResolver = async (
  _: any,
  { signedXDR }: any,
  ctx: any
) => {
  const { verified, source } = verifySourceSignatureOnXDR(signedXDR);
  if (!verified) {
    new GraphQLError('Invalid signed XDR');
  }

  const user = await getUserByPublicKey(source);
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      version: user.version,
    } as any,
    Config.JWT_SECRET,
    { algorithm: 'HS256' }
  );
  user.jwt = token;
  ctx.user = Promise.resolve(user);

  return { ...user, managed: user.seed !== '' };
};
