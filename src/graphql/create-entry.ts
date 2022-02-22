import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
} from 'graphql';

import { getAuthenticatedUser } from '../auth/logic';
import { openSellOffer } from '../stellar/operations';
import { buildNFTTransaction } from '../stellar/index';
import XDR from './types/xdr';
import { Keypair } from 'skyhitz-stellar-base';
import { Config } from '../config';
const shajs = require('sha.js');

const createEntry = {
  type: XDR,
  args: {
    cid: {
      type: new GraphQLNonNull(GraphQLString),
    },
    code: {
      type: new GraphQLNonNull(GraphQLString),
    },
    forSale: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    price: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    equityForSale: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
  },
  async resolve(
    _: any,
    { cid, code, forSale, price, equityForSale }: any,
    ctx: any
  ) {
    let user = await getAuthenticatedUser(ctx);
    const addSellOffer = user.publicKey && forSale;

    const keypairSeed = shajs('sha256')
      .update(Config.ISSUER_SEED + cid)
      .digest();
    const issuerKey = Keypair.fromRawEd25519Seed(keypairSeed);
    const supply = 1;

    const { transaction, xdr } = await buildNFTTransaction(
      user.publicKey,
      issuerKey,
      code,
      supply,
      cid,
      !addSellOffer
    );

    if (addSellOffer) {
      const sellXdr = await openSellOffer(
        transaction,
        issuerKey,
        code,
        user.publicKey,
        equityForSale,
        price / equityForSale
      );
      return sellXdr;
    }

    return xdr;
  },
};

export default createEntry;
