import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
} from 'graphql';

import { getAuthenticatedUser } from '../auth/logic';
import { openSellOffer, signAndSubmitXDR } from '../stellar/operations';
import { buildNFTTransaction } from '../stellar/index';
import ConditionalXDR from './types/conditional-xdr';
import { Keypair } from 'skyhitz-stellar-base';
import { Config } from '../config';
import { decrypt } from '../util/encryption';
const shajs = require('sha.js');

const createEntry = {
  type: ConditionalXDR,
  args: {
    fileCid: {
      type: new GraphQLNonNull(GraphQLString),
    },
    metaCid: {
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
    { fileCid, metaCid, code, forSale, price, equityForSale }: any,
    ctx: any
  ) {
    let user = await getAuthenticatedUser(ctx);
    const addSellOffer = user.publicKey && forSale;
    console.log('create entry: ', user);

    const keypairSeed = shajs('sha256')
      .update(Config.ISSUER_SEED + fileCid)
      .digest();
    const issuerKey = Keypair.fromRawEd25519Seed(keypairSeed);
    const supply = 1;
    let finalXdr;

    const { transaction, xdr } = await buildNFTTransaction(
      user.publicKey,
      issuerKey,
      code,
      supply,
      metaCid,
      !addSellOffer
    );

    finalXdr = xdr;

    if (addSellOffer) {
      try {
        const sellXdr = await openSellOffer(
          transaction,
          issuerKey,
          code,
          user.publicKey,
          equityForSale,
          price / equityForSale
        );
        finalXdr = sellXdr;
      } catch (ex) {
        console.log(ex);
        return {
          xdr: finalXdr,
          success: false,
          submitted: false,
          message: "Couldn't create a sell offer",
        };
      }
    }

    console.log('final xdr', finalXdr);

    if (user.seed) {
      console.log('managed flow', !!user.seed);
      const userSeed = decrypt(user.seed);
      try {
        const result = await signAndSubmitXDR(finalXdr, userSeed);
        return result;
      } catch (ex) {
        const opCodes: string[] = ex.result_codes.operations;
        let message = "Couldn't submit a transaction.";
        if (opCodes.includes('op_bad_auth')) {
          message = 'Uploaded media file is not original.';
        } else if (opCodes.includes('op_underfunded')) {
          message = 'Not enough funds on the account.';
        }

        return { xdr: finalXdr, success: false, submitted: false, message };
      }
    }

    return { xdr: finalXdr, success: true, submitted: false };
  },
};

export default createEntry;
