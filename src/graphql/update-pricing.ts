import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { partialUpdateObject } from '../algolia/algolia';
import { checkIfEntryOwnerHasStripeAccount } from '../payments/subscription';
import { getAll, updateEntry } from '../redis';
import { manageSellOffer, getOfferId } from '../stellar/operations';

const updatePricing = {
  type: GraphQLBoolean,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    price: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    forSale: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    equityForSale: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
  async resolve(_: any, args: any, ctx: any) {
    let { id, price, forSale, equityForSale } = args;

    let user = await getAuthenticatedUser(ctx);
    let [entry, res] = [
      await getAll(`entries:${id}`),
      await getAll(`assets:entry:${id}`),
    ];
    const [assetCode] = Object.keys(res);

    if (entry.forSale) {
      const { publicAddress, seed } = await checkIfEntryOwnerHasStripeAccount(
        user.email
      );
      const offerId = await getOfferId(publicAddress, assetCode);

      await manageSellOffer(
        seed,
        equityForSale,
        price / equityForSale,
        assetCode,
        typeof offerId === 'string' ? parseInt(offerId) : offerId
      );
    }

    entry.price = price;
    entry.forSale = forSale;
    [
      await updateEntry(entry),
      await partialUpdateObject({
        objectID: entry.id,
        price: entry.price,
        forSale: entry.forSale,
      }),
    ];
    return true;
  },
};

export default updatePricing;
