import { getAuthenticatedUser } from '../auth/logic';
import { getEntry } from '../algolia/algolia';
import { manageSellOffer, getOfferId } from '../stellar/operations';

export const updatePricingResolver = async (_: any, args: any, ctx: any) => {
  let { id, price, equityForSale } = args;

  let user = await getAuthenticatedUser(ctx);
  let entry = await getEntry(id);
  console.log(id);

  const { publicKey, seed } = user;
  const offerId = await getOfferId(publicKey, entry.code);

  let transactionResult = await manageSellOffer(
    publicKey,
    equityForSale,
    price / equityForSale,
    entry.code,
    typeof offerId === 'string' ? parseInt(offerId) : offerId,
    seed
  );
  return transactionResult;
};
