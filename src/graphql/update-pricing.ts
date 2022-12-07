import { getAuthenticatedUser } from '../auth/logic';
import { getEntry } from '../algolia/algolia';
import { manageSellOffer } from '../stellar/operations';
import { GraphQLError } from 'graphql';

export const updatePricingResolver = async (_: any, args: any, ctx: any) => {
  const { id, price, equityForSale, forSale, offerID } = args;

  console.log(args);

  try {
    const user = await getAuthenticatedUser(ctx);
    const entry = await getEntry(id);
    console.log(id);

    const { publicKey, seed } = user;
    // handle case when user try to cancel offer but doesn't have one
    if (!forSale && offerID == 0)
      return { xdr: '', success: false, submitted: true };

    let transactionResult = await manageSellOffer(
      publicKey,
      entry.issuer,
      forSale ? equityForSale : 0,
      forSale ? price / equityForSale : 1,
      entry.code,
      typeof offerID === 'string' ? parseInt(offerID) : offerID,
      seed
    );
    return transactionResult;
  } catch (_) {
    throw new GraphQLError('Could not update pricing');
  }
};
