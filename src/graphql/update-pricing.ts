import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql';
import ConditionalXDR from './types/conditional-xdr';
import { getAuthenticatedUser } from '../auth/logic';
import { getEntry, partialUpdateObject } from '../algolia/algolia';
import { manageSellOffer, getOfferId } from '../stellar/operations';

const updatePricing = {
  type: ConditionalXDR,
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
    let entry = await getEntry(id);
    console.log(id);

    let transactionResult = { success: false, xdr: '', submitted: false };

    if (entry.forSale) {
      const { publicKey, seed } = user;
      const offerId = await getOfferId(publicKey, entry.code);

      transactionResult = await manageSellOffer(
        publicKey,
        equityForSale,
        price / equityForSale,
        entry.code,
        typeof offerId === 'string' ? parseInt(offerId) : offerId,
        seed
      );
    }
    entry.price = price;
    entry.forSale = forSale;
    await partialUpdateObject({
      objectID: entry.id,
      forSale: entry.forSale,
    });
    return transactionResult;
  },
};

export default updatePricing;
