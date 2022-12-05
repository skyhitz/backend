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
    const { id, price, equityForSale, forSale } = args;

    const user = await getAuthenticatedUser(ctx);
    const entry = await getEntry(id);

    const { publicKey, seed } = user;
    const offerId = await getOfferId(publicKey, entry.code, entry.issuer);

    // handle case when user try to cancel offer but doesn't have one
    if (!forSale && offerId == 0) return {xdr: '', success: false, submitted: true};

    let transactionResult = await manageSellOffer(
      publicKey,
      entry.issuer,
      forSale ? equityForSale : 0,
      forSale ? price / equityForSale : 1,
      entry.code,
      typeof offerId === 'string' ? parseInt(offerId) : offerId,
      seed
    );
    return transactionResult;
  },
};

export default updatePricing;
