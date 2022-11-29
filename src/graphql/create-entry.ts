import { getAuthenticatedUser } from '../auth/logic';
import { openSellOffer, signAndSubmitXDR } from '../stellar/operations';
import { buildNFTTransaction } from '../stellar/index';
import { Keypair } from 'skyhitz-stellar-base';
import { Config } from '../config';
import { decrypt } from '../util/encryption';
import { GraphQLError } from 'graphql';
const shajs = require('sha.js');

export const createEntryResolver = async (
  _: any,
  { fileCid, metaCid, code, forSale, price, equityForSale }: any,
  ctx: any
) => {
  let user = await getAuthenticatedUser(ctx);
  const addSellOffer = user.publicKey && forSale;
  console.log('create entry: ', user);

  const keypairSeed = shajs('sha256')
    .update(Config.ISSUER_SEED + fileCid)
    .digest();
  const issuerKey = Keypair.fromRawEd25519Seed(keypairSeed);
  const supply = 1;
  let finalXdr;

  try {
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
      const sellXdr = await openSellOffer(
        transaction,
        issuerKey,
        code,
        user.publicKey,
        equityForSale,
        price / equityForSale
      );
      finalXdr = sellXdr;
    }

    console.log('final xdr', finalXdr);

    if (user.seed) {
      console.log('managed flow', !!user.seed);
      const userSeed = decrypt(user.seed);
      const result = await signAndSubmitXDR(finalXdr, userSeed);
      return result;
    }
    return { xdr: finalXdr, success: true, submitted: false };
  } catch (ex) {
    const opCodes: string[] = ex.result_codes.operations;
    let message =
      'There was an error during building and submitting transaction.';
    if (opCodes && opCodes.includes('op_bad_auth')) {
      message = 'Uploaded media file is not original.';
    } else if (opCodes && opCodes.includes('op_underfunded')) {
      message = 'Not enough funds on the account.';
    }

    throw new GraphQLError(message);
  }
};
