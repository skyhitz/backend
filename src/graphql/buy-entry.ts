import { GraphQLString, GraphQLNonNull, GraphQLFloat } from 'graphql';
import { sendNftBoughtEmail, sendNftSoldEmail } from 'src/sendgrid/sendgrid';
import { getEntry } from '../algolia/algolia';
import { getAuthenticatedUser } from '../auth/logic';
import { accountCredits, buyViaPathPayment } from '../stellar/operations';
import { decrypt } from '../util/encryption';
import ConditionalXDR from './types/conditional-xdr';
import { getPublicKeyFromTransactionResult } from 'src/stellar/operations';
import { getUserByPublicKey } from 'src/algolia/algolia';
import { deleteCache } from 'src/util/axios-cache';
import { Config } from 'src/config';

async function customerInfo(user: any) {
  let { availableCredits: credits } = await accountCredits(user.publicKey);
  let userSeed = user.seed ? decrypt(user.seed) : '';
  return { credits, seed: userSeed };
}

const buyEntry = {
  type: ConditionalXDR,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    amount: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    price: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
  },
  async resolve(_: any, args: any, ctx: any) {
    const { id, amount, price } = args;
    const user = await getAuthenticatedUser(ctx);

    const [{ credits, seed }, { code, issuer }] = [
      await customerInfo(user),
      await getEntry(id),
    ];

    const total = price * amount;

    if (credits >= total) {
      // // send payment from buyer to owner of entry
      try {
        if (seed) {
          const result = await buyViaPathPayment(
            user.publicKey,
            amount,
            price,
            code,
            issuer,
            seed
          );
          const publicKey = getPublicKeyFromTransactionResult(result.xdr);
          const seller = await getUserByPublicKey(publicKey);

          await sendNftBoughtEmail(user.email);

          if (seller) {
            await sendNftSoldEmail(seller.email);
          }
          
          deleteEntryCache(code, issuer);
          return result;
        } else {
          const result = await buyViaPathPayment(
            user.publicKey,
            amount,
            price,
            code,
            issuer
          );
          
          deleteEntryCache(code, issuer);
          return result;
        }
      } catch (ex) {
        console.log(ex);
        let message = 'There was an error during submitting a transaction';
        if (ex?.result_codes?.operations) {
          const opCodes: string[] = ex.result_codes.operations;
          if (opCodes.includes('op_over_source_max')) {
            message = 'Couldn not find an offer within the budget';
          } else if (opCodes.includes('op_underfunded')) {
            message = 'Not enough funds on the account.';
          }
        }

        throw message;
      }
    }

    return { xdr: '', success: false, submitted: false };
  },
};

export default buyEntry;


const deleteEntryCache = (code: string, issuer: string) => {
  const assetId = `${code}-${issuer}`;
  const baseURL = 'https://api.stellar.expert/explorer/';

  const urls = [
    `${baseURL}${Config.STELLAR_NETWORK}/asset/${assetId}/history/all?limit=100`,
    `${baseURL}${Config.STELLAR_NETWORK}/asset/${assetId}/holders?limit=100`,
    `${baseURL}${Config.STELLAR_NETWORK}/asset/${assetId}/history/offers?limit=100&order=desc`
  ];

  deleteCache(urls);
}