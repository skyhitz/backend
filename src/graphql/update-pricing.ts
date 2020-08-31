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
  },
  async resolve(_: any, args: any, ctx: any) {
    let { id, price, forSale } = args;

    let user = await getAuthenticatedUser(ctx);
    let entry = await getAll(`entries:${id}`);

    try {
      const result = getAll(`owners:entries:${id}`);
      const [ownerId] = Object.keys(result);
      if (user.id !== ownerId) {
        return false;
      }
    } catch (e) {
      return false;
    }

    if (entry.forSale) {
      await checkIfEntryOwnerHasStripeAccount(user.email);
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
