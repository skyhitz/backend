import * as jwt from 'jsonwebtoken';
import { Config } from '../config';
import { getAuthenticatedUser } from 'src/auth/logic';

export const getAudibleTokenResolver = async (_: any, __: any, ctx: any) => {
  const user = await getAuthenticatedUser(ctx);

  // generates access token to audible magic service
  // it's valid only 120 seconds to ensure that it isn't used for other purpose
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    } as any,
    Config.AUDIBLE_SECRET,
    { algorithm: 'RS256', expiresIn: 120 }
  );

  return { token };
};
