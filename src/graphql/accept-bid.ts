import { getAuthenticatedUser } from '../auth/logic';
import {
  getAccountData,
  getOffer,
  sellViaPathPayment,
} from '../stellar/operations';
import { decrypt } from '../util/encryption';
import { GraphQLError } from 'graphql';
import { Config } from '../config';
import { deleteCache } from '../util/axios-cache';

export const acceptBidResolver = async (_: any, args: any, ctx: any) => {
  const { id } = args;

  const user = await getAuthenticatedUser(ctx);

  const [offer, data] = await Promise.all([
    getOffer(id),
    getAccountData(user.publicKey),
  ]);

  console.log(offer, data);

  const { asset_code, asset_issuer } = offer.buying;
  const amount = parseFloat(offer.amount);
  const price = parseFloat(offer.price);

  const [currentBalance] = data.balances.filter(
    (balance: any) =>
      balance.asset_code === asset_code && balance.asset_issuer === asset_issuer
  );

  if (!currentBalance || currentBalance.balance < amount * price) {
    throw new GraphQLError(
      "You don't have enough asset amount to accept the bid"
    );
  }

  try {
    const result = await sellViaPathPayment(
      user.publicKey,
      amount,
      price,
      asset_code,
      asset_issuer,
      user.seed ? decrypt(user.seed) : undefined
    );
    deleteEntryCache(asset_code, asset_issuer);

    return result;
  } catch (ex) {
    console.log(ex);
    let message = 'There was an error during submitting a transaction';
    if (ex?.result_codes?.operations) {
      const opCodes: string[] = ex.result_codes.operations;
      if (opCodes.includes('op_over_source_max')) {
        message = 'Couldn not find an offer within the budget!';
      } else if (opCodes.includes('op_underfunded')) {
        message = 'Not enough funds on the account!';
      } else if (opCodes.includes('op_cross_self')) {
        message = 'You cannot buy a nft from yourself!';
      }
    }

    throw new GraphQLError(message);
  }
};

const deleteEntryCache = (code: string, issuer: string) => {
  const assetId = `${code}-${issuer}`;
  const baseURL = 'https://api.stellar.expert/explorer/';

  const urls = [
    `${baseURL}${Config.STELLAR_NETWORK}/asset/${assetId}/history/all?limit=100`,
    `${baseURL}${Config.STELLAR_NETWORK}/asset/${assetId}/holders?limit=100`,
    `${baseURL}${Config.STELLAR_NETWORK}/asset/${assetId}/history/offers?limit=100&order=desc`,
  ];

  deleteCache(urls);
};
