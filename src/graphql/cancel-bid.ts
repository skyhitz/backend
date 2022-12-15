import { getAuthenticatedUser } from '../auth/logic';
import { cancelBuyOffer, getOffer } from '../stellar/operations';
import { decrypt } from '../util/encryption';
import { GraphQLError } from 'graphql';
import { cancelBid } from '../algolia/algolia';

export const cancelBidResolver = async (_: any, args: any, ctx: any) => {
  const { id } = args;

  const [user, offer] = await Promise.all([
    getAuthenticatedUser(ctx),
    getOffer(id),
  ]);

  if (user.publicKey !== offer.seller) {
    throw new GraphQLError('This offer does not belong to the given user');
  }

  await cancelBid(id);

  return await cancelBuyOffer(
    offer.buying.asset_issuer,
    offer.buying.asset_code,
    user.publicKey,
    user.seed ? decrypt(user.seed) : undefined,
    id
  );
};
