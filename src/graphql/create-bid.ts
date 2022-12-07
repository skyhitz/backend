import { getAuthenticatedUser } from '../auth/logic';
import { getEntry } from '../algolia/algolia';
import { openBuyOffer } from '../stellar/operations';
import { decrypt } from '../util/encryption';

export const createBid = async (_: any, args: any, ctx: any) => {
  const { id, price, equityToBuy } = args;

  const [user, entry] = await Promise.all([
    getAuthenticatedUser(ctx),
    getEntry(id),
  ]);

  return await openBuyOffer(
    entry.issuer,
    entry.code,
    user.publicKey,
    user.seed ? decrypt(user.seed) : undefined,
    equityToBuy,
    price / equityToBuy
  );
};
