import axios from 'axios';
import {
  Keypair,
  Asset,
  TransactionBuilder,
  Operation,
  Account,
  Networks,
  Transaction,
  StrKey,
  xdr,
} from 'skyhitz-stellar-base';
import { Config } from '../config';
export const sourceKeys = Keypair.fromSecret(Config.ISSUER_SEED);

const XLM = Asset.native();

const NETWORK_PASSPHRASE =
  Config.ENV === 'production' ? Networks.PUBLIC : Networks.TESTNET;

export const getFee = (
  horizonUrl: string = Config.HORIZON_URL
): Promise<string> => {
  return axios
    .get(horizonUrl + `/fee_stats`)
    .then(({ data }) => data)
    .then((feeStats) => feeStats.max_fee.mode)
    .catch(() => '10000');
};

export const submitTransaction = async (
  transaction: Transaction,
  horizonUrl: string = Config.HORIZON_URL
) => {
  const xdr = transaction.toXDR();
  console.log('submitted xdr: ', xdr);

  return axios
    .post(`${horizonUrl}/transactions?tx=${encodeURIComponent(xdr)}`)
    .then(({ data }) => data)
    .catch((error) => {
      const { data } = error.response;
      const { extras } = data;
      console.log(extras);
      throw extras;
    });
};

export async function getAccountData(publicKey) {
  let account = await axios
    .get(`${Config.HORIZON_URL}/accounts/${publicKey}`)
    .then(({ data }) => data);
  return account;
}

export async function getOffers(seller, sellingAsset, sellingIssuer) {
  const encodedSelling = encodeURIComponent(`${sellingAsset}:${sellingIssuer}`);
  let account = await axios
    .get(
      `${Config.HORIZON_URL}/offers/selling=${encodedSelling}&seller=${seller}`
    )
    .then(({ data }) => data);
  return account;
}

export async function getOffer(offerId) {
  const offer = await axios
    .get(`${Config.HORIZON_URL}/offers/${offerId}`)
    .then(({ data }) => data);
  return offer;
}

export async function getOrderbook(
  sellingAssetCode: string,
  sellingIssuer: string
) {
  let account = await axios
    .get(
      `${Config.HORIZON_URL}/order_book?selling_asset_type=credit_alphanum12&selling_asset_code=${sellingAssetCode}&selling_asset_issuer=${sellingIssuer}&buying_asset_type=native`
    )
    .then(({ data }) => data);
  return account;
}

export async function getAccount(publicKey) {
  const { id, sequence } = await getAccountData(publicKey);
  return new Account(id, sequence);
}

export async function accountExists(publicKey: string) {
  try {
    await getAccountData(publicKey);
  } catch (e) {
    return false;
  }
  return true;
}

export async function buildTransactionWithFee(accountPublicKey) {
  const [account, fee] = await Promise.all([
    await getAccount(accountPublicKey),
    await getFee(),
  ]);
  return new TransactionBuilder(account, {
    fee: fee,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
}

export async function fundAccount(destinationKeys: Keypair) {
  if (!destinationKeys.publicKey()) {
    throw 'Account does not exist';
  }

  let transaction = (await buildTransactionWithFee(sourceKeys.publicKey()))
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      Operation.createAccount({
        destination: destinationKeys.publicKey(),
        startingBalance: '0',
      })
    )
    .addOperation(
      Operation.endSponsoringFutureReserves({
        source: destinationKeys.publicKey(),
      })
    )
    .setTimeout(0)
    .build();
  transaction.sign(sourceKeys, destinationKeys);
  return submitTransaction(transaction);
}

export async function createAndFundAccount() {
  let pair = Keypair.random();
  let secret = pair.secret();
  let publicAddress = pair.publicKey();
  try {
    await fundAccount(pair);
  } catch (e) {
    if (e && e.response) {
      console.log(e.response);
    }
    throw e;
  }
  return {
    secret,
    publicAddress,
  };
}

export async function openSellOffer(
  transaction: TransactionBuilder,
  issuerKey: Keypair,
  code: string,
  publicAddress: string,
  amount: number,
  price: number
) {
  const newAsset = new Asset(code, issuerKey.publicKey());
  const transactionBuilt = transaction
    .addOperation(
      Operation.manageSellOffer({
        selling: newAsset,
        buying: XLM,
        amount: amount.toFixed(6),
        price: price.toFixed(6),
        source: publicAddress,
        offerId: 0,
      })
    )
    .build();

  transactionBuilt.sign(issuerKey);

  return transactionBuilt.toXDR();
}

export async function openBuyOffer(
  issuer: string,
  code: string,
  publicAddress: string,
  seed: string,
  amount: number,
  price: number
) {
  const asset = new Asset(code, issuer);
  const transaction = (await buildTransactionWithFee(sourceKeys.publicKey()))
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: publicAddress,
      })
    )
    .addOperation(
      Operation.changeTrust({
        asset: asset,
        source: publicAddress,
      })
    )
    .addOperation(
      Operation.endSponsoringFutureReserves({
        source: publicAddress,
      })
    )
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: publicAddress,
      })
    )
    .addOperation(
      Operation.manageBuyOffer({
        selling: XLM,
        buying: asset,
        buyAmount: amount.toFixed(6),
        price: price.toFixed(6),
        source: publicAddress,
        offerId: 0,
      })
    )
    .addOperation(
      Operation.endSponsoringFutureReserves({
        source: publicAddress,
      })
    )
    .setTimeout(0)
    .build();

  if (seed) {
    const keys = Keypair.fromSecret(seed);
    transaction.sign(sourceKeys, keys);
    const data = await submitTransaction(transaction);
    const { result_xdr, successful } = data;
    return { xdr: result_xdr, success: successful, submitted: true };
  }

  transaction.sign(sourceKeys);
  return {
    xdr: transaction.toEnvelope().toXDR('base64'),
    success: true,
    submitted: false,
  };
}

export async function cancelBuyOffer(
  issuer: string,
  code: string,
  publicAddress: string,
  seed: string,
  offerId: string
) {
  const asset = new Asset(code, issuer);
  const transaction = (await buildTransactionWithFee(sourceKeys.publicKey()))
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: publicAddress,
      })
    )
    .addOperation(
      Operation.manageBuyOffer({
        selling: XLM,
        buying: asset,
        buyAmount: '0',
        price: '1',
        source: publicAddress,
        offerId: offerId,
      })
    )
    .addOperation(
      Operation.endSponsoringFutureReserves({
        source: publicAddress,
      })
    )
    .setTimeout(0)
    .build();

  if (seed) {
    const keys = Keypair.fromSecret(seed);
    transaction.sign(sourceKeys, keys);
    const data = await submitTransaction(transaction);
    const { result_xdr, successful } = data;
    return { xdr: result_xdr, success: successful, submitted: true };
  }

  transaction.sign(sourceKeys);
  return {
    xdr: transaction.toEnvelope().toXDR('base64'),
    success: true,
    submitted: false,
  };
}

export async function buyViaPathPayment(
  destinationPublicKey: string,
  amount: number,
  price: number,
  assetCode: string,
  issuer: string,
  destinationSeed?: string
) {
  const nftAsset = new Asset(assetCode, issuer);
  const sendMax = amount * price;
  const sendMaxString = sendMax.toFixed(7);
  // price of 1 unit in terms of buying, 100 will be 100 usd per one share
  const transaction = (await buildTransactionWithFee(sourceKeys.publicKey()))
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationPublicKey,
      })
    )
    .addOperation(
      Operation.changeTrust({
        asset: nftAsset,
        source: destinationPublicKey,
      })
    )
    .addOperation(
      Operation.endSponsoringFutureReserves({
        source: destinationPublicKey,
      })
    )
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationPublicKey,
      })
    )
    .addOperation(
      Operation.pathPaymentStrictReceive({
        sendAsset: XLM,
        sendMax: sendMaxString,
        source: destinationPublicKey,
        destination: destinationPublicKey,
        destAsset: nftAsset,
        destAmount: amount.toString(),
      })
    )
    .addOperation(
      Operation.endSponsoringFutureReserves({
        source: destinationPublicKey,
      })
    )
    .setTimeout(0)
    .build();

  if (destinationSeed) {
    const destinationKeys = Keypair.fromSecret(destinationSeed);
    transaction.sign(sourceKeys, destinationKeys);
    const data = await submitTransaction(transaction);
    const { result_xdr, successful } = data;
    return { xdr: result_xdr, success: successful, submitted: true };
  }

  transaction.sign(sourceKeys);
  return {
    xdr: transaction.toEnvelope().toXDR('base64'),
    success: true,
    submitted: false,
  };
}

export async function signAndSubmitXDR(xdr: string, seed: string) {
  const keys = Keypair.fromSecret(seed);
  const transaction = new Transaction(xdr, NETWORK_PASSPHRASE);

  transaction.sign(keys);
  const { result_xdr, successful } = await submitTransaction(transaction);
  return { xdr: result_xdr, success: successful, submitted: true };
}

export async function getOfferId(sellingAccount, assetCode) {
  const offers = await getOffers(
    sellingAccount,
    assetCode,
    sourceKeys.publicKey()
  );

  let offer = offers.records[0];
  return offer.id;
}

export async function manageSellOffer(
  destinationPublicKey: string,
  amount: number,
  price: number,
  assetCode: string,
  offerId = 0,
  destinationSeed
) {
  const newAsset = new Asset(assetCode, sourceKeys.publicKey());

  // price of 1 unit in terms of buying, 100 will be 100 usd per one share
  const transaction = (await buildTransactionWithFee(sourceKeys.publicKey()))
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationPublicKey,
      })
    )
    .addOperation(
      Operation.manageSellOffer({
        selling: newAsset,
        buying: XLM,
        amount: amount.toString(),
        price: price.toString(),
        source: destinationPublicKey,
        offerId: offerId,
      })
    )
    .addOperation(
      Operation.endSponsoringFutureReserves({
        source: destinationPublicKey,
      })
    )
    .setTimeout(0)
    .build();

  if (destinationSeed) {
    const destinationKeys = Keypair.fromSecret(destinationSeed);
    transaction.sign(sourceKeys, destinationKeys);
    let { status, result_xdr } = await submitTransaction(transaction);
    return { xdr: result_xdr, success: status === 200, submitted: true };
  }

  transaction.sign(sourceKeys);
  return {
    xdr: transaction.toEnvelope().toXDR('base64'),
    success: true,
    submitted: false,
  };
}

export async function sendOwnershipOfAsset(
  destinationSeed: string,
  assetCode: string
) {
  const limitOfShares = '100';
  const newAsset = new Asset(assetCode, sourceKeys.publicKey());
  const destinationKeys = Keypair.fromSecret(destinationSeed);
  const transaction = (await buildTransactionWithFee(sourceKeys.publicKey()))
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      Operation.changeTrust({
        asset: newAsset,
        limit: limitOfShares,
        source: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      Operation.endSponsoringFutureReserves({
        source: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      Operation.payment({
        destination: destinationKeys.publicKey(),
        asset: newAsset,
        amount: limitOfShares,
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeys, destinationKeys);
  let transactionResult = await submitTransaction(transaction);
  return transactionResult;
}

export async function sendSubscriptionTokens(
  destinationKey: string,
  amount: string
) {
  const transaction = (await buildTransactionWithFee(sourceKeys.publicKey()))
    .addOperation(
      Operation.payment({
        destination: destinationKey,
        asset: XLM,
        amount: amount,
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeys);
  return submitTransaction(transaction);
}

export async function accountCredits(publicAddress: string) {
  const { balances, subentry_count, num_sponsoring, num_sponsored }: any =
    await getAccountData(publicAddress);

  const [currentBalance] = balances.filter(
    (balance: any) => balance.asset_type === 'native'
  );
  if (currentBalance && currentBalance.balance) {
    const floatBalance = parseFloat(currentBalance.balance);
    const minBalance =
      (2 + subentry_count + num_sponsoring - num_sponsored) * 0.5;

    const availableCredits = floatBalance - minBalance;
    return { credits: floatBalance, availableCredits };
  }
  return { credits: 0, availableCredits: 0 };
}

export async function payment(
  publicAddress: string,
  seed: string,
  amount: number
) {
  const sourceKeypair = Keypair.fromSecret(seed);
  const sourcePublicKey = sourceKeypair.publicKey();

  let transaction = (await buildTransactionWithFee(sourcePublicKey))
    .addOperation(
      Operation.payment({
        destination: publicAddress,
        asset: XLM,
        amount: amount.toString(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeypair);
  let transactionResult = await submitTransaction(transaction);
  console.log('\nSuccess! View the transaction at: ', transactionResult);
  return transactionResult;
}

export async function getAsks(newAssetCode) {
  let response = await getOrderbook(newAssetCode, sourceKeys.publicKey());
  return response.asks[0];
}

export async function getXlmInUsdDexPrice() {
  let response = await axios
    .get(
      `https://horizon.stellar.org/order_book?selling_asset_type=native&buying_asset_type=credit_alphanum4&buying_asset_code=USDC&buying_asset_issuer=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`
    )
    .then(({ data }) => data);
  return response.bids[0];
}

export async function loadSkyhitzAssets(sourcePublicKey) {
  let { balances } = await getAccountData(sourcePublicKey);
  const assetCodes = balances
    .filter((balance: any) => {
      if (balance.asset_type !== 'native') {
        return true;
      }
      return false;
    })
    .map((ba: any) => ba.asset_code);
  return assetCodes;
}

export async function payUserInXLM(address: string, amount: number) {
  let transaction = (await buildTransactionWithFee(sourceKeys.publicKey()))
    .addOperation(
      Operation.payment({
        destination: address,
        asset: XLM,
        amount: amount.toFixed(6).toString(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeys);
  let transactionResult = await submitTransaction(transaction);
  console.log('\nSuccess! View the transaction at: ', transactionResult);
  return transactionResult;
}

export async function withdrawToExternalAddress(
  address: string,
  amount: number,
  seed: string
) {
  const keys = Keypair.fromSecret(seed);
  const accountPublicKey = keys.publicKey();

  const transactionFee = amount * parseFloat(Config.TRANSACTION_FEE);

  const transaction = (await buildTransactionWithFee(accountPublicKey))
    .addOperation(
      Operation.payment({
        destination: sourceKeys.publicKey(),
        asset: XLM,
        amount: transactionFee.toFixed(6).toString(),
      })
    )
    .addOperation(
      Operation.payment({
        destination: address,
        asset: XLM,
        amount: (amount - transactionFee).toFixed(6).toString(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(keys);
  const transactionResult = await submitTransaction(transaction);
  console.log('\nSuccess! View the transaction at: ', transactionResult);
  return transactionResult;
}

export async function withdrawAndMerge(
  address: string,
  accountBalance: number,
  seed: string
) {
  const keys = Keypair.fromSecret(seed);
  const accountPublicKey = keys.publicKey();

  const transactionFee = accountBalance * parseFloat(Config.TRANSACTION_FEE);

  const transaction = (await buildTransactionWithFee(accountPublicKey))
    .addOperation(
      Operation.payment({
        destination: address,
        asset: XLM,
        amount: (accountBalance - transactionFee).toFixed(6).toString(),
      })
    )
    .addOperation(
      Operation.accountMerge({
        destination: sourceKeys.publicKey(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(keys);
  const transactionResult = await submitTransaction(transaction);
  console.log('\nSuccess! View the transaction at: ', transactionResult);
  return transactionResult;
}

export function getPublicKeyFromTransactionResult(resultXdr) {
  const transaction = xdr.TransactionResult.fromXDR(resultXdr, 'base64');
  const sellerId = transaction
    .result()
    .value()[4]
    .value()
    .pathPaymentStrictReceiveResult()
    .success()
    .offers()[0]
    .orderBook()
    .sellerId()
    .value();

  return StrKey.encodeEd25519PublicKey(sellerId);
}
