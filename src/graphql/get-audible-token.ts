import * as jwt from 'jsonwebtoken';
import { Config } from '../config';
import Token from './types/token';
import { getAuthenticatedUser } from '../auth/logic';

const GetAudibleToken = {
  type: Token,
  args: {},
  async resolve(_: any, __: any, ctx: any) {
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
  },
};

export default GetAudibleToken;
