import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLFloat
} from 'graphql';
import ConditionalXDR from './types/conditional-xdr';
import { getAuthenticatedUser } from '../auth/logic';
import { getEntry } from '../algolia/algolia';
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
      type: new GraphQLNonNull(GraphQLFloat),
    },
  },
  async resolve(_: any, args: any, ctx: any) {
    let { id, price, equityForSale } = args;

    let user = await getAuthenticatedUser(ctx);
    let entry = await getEntry(id);

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
  },
};

export default updatePricing;
