import { getAuthenticatedUser } from '../auth/logic';
import { cancelBuyOffer, getOffer } from '../stellar/operations';
import { decrypt } from '../util/encryption';
import { GraphQLError } from 'graphql';

export const cancelBid = async (_: any, args: any, ctx: any) => {
  const { id } = args;

  const [user, offer] = await Promise.all([
    getAuthenticatedUser(ctx),
    getOffer(id),
  ]);

  if (user.publicKey !== offer.seller) {
    throw new GraphQLError('This offer does not belong to the given user');
  }

  try {
    const res = await cancelBuyOffer(
      offer.buying.asset_issuer,
      offer.buying.asset_code,
      user.publicKey,
      decrypt(user.seed),
      id
    );
    return res;
  } catch (ex) {
    console.log(ex);
    throw ex;
  }
};
