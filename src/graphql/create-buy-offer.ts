import { getAuthenticatedUser } from '../auth/logic';
import { getEntry } from '../algolia/algolia';
import { openBuyOffer } from '../stellar/operations';
import { decrypt } from '../util/encryption';

export const createBuyOffer = async (_: any, args: any, ctx: any) => {
  const { id, price, equityToBuy } = args;

  console.log('received');

  const [user, entry] = await Promise.all([
    getAuthenticatedUser(ctx),
    getEntry(id),
  ]);

  console.log(price, equityToBuy);

  return await openBuyOffer(
    entry.issuer,
    entry.code,
    user.publicKey,
    decrypt(user.seed),
    equityToBuy,
    price / equityToBuy
  );
};
