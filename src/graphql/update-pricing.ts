import { getAuthenticatedUser } from '../auth/logic';
import { getEntry } from '../algolia/algolia';
import { manageSellOffer } from '../stellar/operations';
import { GraphQLError } from 'graphql';

export const updatePricingResolver = async (_: any, args: any, ctx: any) => {
  const { id, price, equityForSale, forSale, offerID } = args;

  try {
    const { user, entry } = await Promise.all([
      await getAuthenticatedUser(ctx),
      await getEntry(id),
    ]).then((results) => {
      return { user: results[0], entry: results[1] };
    });

    const { publicKey, seed } = user;
    // handle case when user try to cancel offer but doesn't have one
    if (!forSale && offerID == 0)
      return new GraphQLError("Current user doesn't have any offers");

    const transactionResult = await manageSellOffer(
      publicKey,
      entry.issuer,
      forSale ? equityForSale : 0,
      forSale ? price / equityForSale : 1,
      entry.code,
      offerID,
      seed
    );
    return transactionResult;
  } catch (_) {
    throw new GraphQLError('Could not update pricing');
  }
};
