import { GraphQLString } from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { Keypair } from 'skyhitz-stellar-base';
import { setIssuer } from '../algolia/algolia';

const generateIssuer = {
  type: GraphQLString,
  async resolve(_: any, args, ctx: any) {
    const user = await getAuthenticatedUser(ctx);

    const issuerKey = Keypair.random();
    const seed = issuerKey.secret();
    await setIssuer(user, seed);
    return issuerKey.publicKey();
  },
};

export default generateIssuer;
