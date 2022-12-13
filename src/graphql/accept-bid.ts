import { getAuthenticatedUser } from '../auth/logic';
import {
  // accountCredits,
  getAccountData,
  getOffer,
} from '../stellar/operations';
// import { decrypt } from '../util/encryption';
import { GraphQLError } from 'graphql';
// import { Config } from '../config';
// import { deleteCache } from '../util/axios-cache';

// async function customerInfo(user: any) {
//   let { availableCredits: credits } = await accountCredits(user.publicKey);
//   let userSeed = user.seed ? decrypt(user.seed) : '';
//   return { credits, seed: userSeed };
// }

export const acceptBidResolver = async (_: any, args: any, ctx: any) => {
  const { id } = args;

  const user = await getAuthenticatedUser(ctx);

  const [offer, data] = await Promise.all([
    getOffer(id),
    getAccountData(user.publicKey),
  ]);

  console.log(offer, data);

  const { asset_code, asset_issuer } = offer.buying;

  const amountOfAsset = offer.amount * offer.price;
  const [currentBalance] = data.balances.filter(
    (balance: any) =>
      balance.asset_code === asset_code && balance.asset_issuer === asset_issuer
  );

  if (!currentBalance || currentBalance.balance < amountOfAsset) {
    throw new GraphQLError(
      "You don't have enough asset amount to accept the bid"
    );
  }

  // TODO

  //   if (credits >= total) {
  //     // // send payment from buyer to owner of entry
  //     try {
  //       if (seed) {
  //         const result = await buyViaPathPayment(
  //           user.publicKey,
  //           amount,
  //           price,
  //           code,
  //           issuer,
  //           seed
  //         );
  //         const publicKey = getPublicKeyFromTransactionResult(result.xdr);
  //         const seller = await getUserByPublicKey(publicKey);

  //         await sendNftBoughtEmail(user.email);

  //         if (seller) {
  //           await sendNftSoldEmail(seller.email);
  //         }

  //         deleteEntryCache(code, issuer);

  //         return result;
  //       } else {
  //         const result = await buyViaPathPayment(
  //           user.publicKey,
  //           amount,
  //           price,
  //           code,
  //           issuer
  //         );
  //         deleteEntryCache(code, issuer);

  //         return result;
  //       }
  //     } catch (ex) {
  //       console.log(ex);
  //       let message = 'There was an error during submitting a transaction';
  //       if (ex?.result_codes?.operations) {
  //         const opCodes: string[] = ex.result_codes.operations;
  //         if (opCodes.includes('op_over_source_max')) {
  //           message = 'Couldn not find an offer within the budget!';
  //         } else if (opCodes.includes('op_underfunded')) {
  //           message = 'Not enough funds on the account!';
  //         } else if (opCodes.includes('op_cross_self')) {
  //           message = 'You cannot buy a nft from yourself!';
  //         }
  //       }

  //       throw new GraphQLError(message);
  //     }
  //   }

  //   return { xdr: '', success: false, submitted: false };
};

// const deleteEntryCache = (code: string, issuer: string) => {
//   const assetId = `${code}-${issuer}`;
//   const baseURL = 'https://api.stellar.expert/explorer/';

//   const urls = [
//     `${baseURL}${Config.STELLAR_NETWORK}/asset/${assetId}/history/all?limit=100`,
//     `${baseURL}${Config.STELLAR_NETWORK}/asset/${assetId}/holders?limit=100`,
//     `${baseURL}${Config.STELLAR_NETWORK}/asset/${assetId}/history/offers?limit=100&order=desc`,
//   ];

//   deleteCache(urls);
// };
