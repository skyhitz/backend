import { getAuthenticatedUser } from '../auth/logic';
import { getEntry } from '../algolia/algolia';
import { accountCredits, openBuyOffer } from '../stellar/operations';
import { decrypt } from '../util/encryption';
import { GraphQLError } from 'graphql';

export const createBid = async (_: any, args: any, ctx: any) => {
  const { id, price, equityToBuy } = args;

  const user = await getAuthenticatedUser(ctx);

  const [{ availableCredits }, entry] = await Promise.all([
    accountCredits(user.publicKey),
    getEntry(id),
  ]);

  if (availableCredits < price) {
    throw new GraphQLError("You don't have enought credits on your account!");
  }

  return await openBuyOffer(
    entry.issuer,
    entry.code,
    user.publicKey,
    user.seed ? decrypt(user.seed) : undefined,
    equityToBuy,
    price / equityToBuy
  );
};
