import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLFloat,
} from 'graphql';
import ConditionalXDR from './types/conditional-xdr';
import { getAuthenticatedUser } from '../auth/logic';
import { getEntry } from '../algolia/algolia';
import { openBuyOffer } from '../stellar/operations';
import { decrypt } from '../util/encryption';

export const createBuyOffer = {
  type: ConditionalXDR,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    price: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    equityToBuy: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
  },
  async resolve(_: any, args: any, ctx: any) {
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
  },
};
