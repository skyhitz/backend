import axios from 'axios';
import {
  Keypair,
  Asset,
  TransactionBuilder,
  Operation,
  Account,
  Networks,
  Transaction,
  BASE_FEE,
} from 'skyhitz-stellar-base';
import { Config } from '../config';
export const sourceKeys = Keypair.fromSecret(Config.ISSUER_SEED);
const assetCode = 'SKYHITZ';
const asset = new Asset(assetCode, sourceKeys.publicKey());

const XLM = Asset.native();

const NETWORK_PASSPHRASE =
  Config.ENV === 'production' ? Networks.PUBLIC : Networks.TESTNET;

export const submitTransaction = async (
  transaction: Transaction,
  horizonUrl: string = Config.HORIZON_URL
) => {
  const xdr = transaction.toXDR();

  return axios
    .post(`${horizonUrl}/transactions?tx=${encodeURIComponent(xdr)}`)
    .then(({ data }) => data)
    .catch((error) => {
      console.log(error);
      throw error.response.data;
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

export async function getOrderbook(
  sellingAssetCode: string,
  sellingIssuer: string,
  buyingAssetCode: string,
  buyingIssuer: string
) {
  let account = await axios
    .get(
      `${Config.HORIZON_URL}/order_book?selling_asset_type=credit_alphanum12&selling_asset_code=${sellingAssetCode}&selling_asset_issuer=${sellingIssuer}&buying_asset_type=credit_alphanum12&buying_asset_code=${buyingAssetCode}&buying_asset_issuer=${buyingIssuer}`
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

export async function fundAccount(destinationKeys: Keypair) {
  if (!destinationKeys.publicKey()) {
    throw 'Account does not exist';
  }

  let transaction = new TransactionBuilder(
    await getAccount(sourceKeys.publicKey()),
    {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    }
  )
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
  transaction,
  issuerKey,
  code: string,
  publicAddress: string,
  amount: number,
  price: number
) {
  const newAsset = new Asset(code, issuerKey.publicKey());
  transaction
    .addOperation(
      Operation.manageSellOffer({
        selling: newAsset,
        buying: XLM,
        amount: amount.toString(),
        price: price.toString(),
        source: publicAddress,
        offerId: 0,
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(issuerKey.secret());

  const xdr = transaction.toEnvelope().toXDR('base64');
  return xdr;
}

export async function manageBuyOffer(
  destinationSeed: string,
  amount: number,
  price: number,
  assetCode: string
) {
  const destinationKeys = Keypair.fromSecret(destinationSeed);
  const newAsset = new Asset(assetCode, sourceKeys.publicKey());

  // price of 1 unit in terms of buying, 100 will be 100 usd per one share
  const transaction = new TransactionBuilder(
    await getAccount(sourceKeys.publicKey()),
    {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    }
  )
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      Operation.changeTrust({
        asset: newAsset,
        source: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      Operation.endSponsoringFutureReserves({
        source: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      Operation.manageBuyOffer({
        selling: asset,
        buying: newAsset,
        buyAmount: amount.toString(),
        price: price.toString(),
        source: destinationKeys.publicKey(),
        offerId: 0,
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
  let transactionResult = await submitTransaction(transaction);
  return transactionResult;
}

export async function getOfferId(sellingAccount, assetCode) {
  let offers = await getOffers(
    sellingAccount,
    assetCode,
    sourceKeys.publicKey()
  );

  let offer = offers.records[0];
  return offer.id;
}

export async function manageSellOffer(
  destinationSeed: string,
  amount: number,
  price: number,
  assetCode: string,
  offerId = 0
) {
  const destinationKeys = Keypair.fromSecret(destinationSeed);
  const newAsset = new Asset(assetCode, sourceKeys.publicKey());

  // price of 1 unit in terms of buying, 100 will be 100 usd per one share
  const transaction = new TransactionBuilder(
    await getAccount(sourceKeys.publicKey()),
    {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    }
  )
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      Operation.manageSellOffer({
        selling: newAsset,
        buying: asset,
        amount: amount.toString(),
        price: price.toString(),
        source: destinationKeys.publicKey(),
        offerId: offerId,
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
  let transactionResult = await submitTransaction(transaction);
  return transactionResult;
}

export async function allowTrust(destinationSeed: string) {
  const destinationKeys = Keypair.fromSecret(destinationSeed);
  const transaction = new TransactionBuilder(
    await getAccount(sourceKeys.publicKey()),
    {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    }
  )
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      Operation.changeTrust({
        asset: asset,
        source: destinationKeys.publicKey(),
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
  let transactionResult = await submitTransaction(transaction);
  return transactionResult;
}

export async function sendOwnershipOfAsset(
  destinationSeed: string,
  assetCode: string
) {
  const limitOfShares = '100';
  const newAsset = new Asset(assetCode, sourceKeys.publicKey());
  const destinationKeys = Keypair.fromSecret(destinationSeed);
  const transaction = new TransactionBuilder(
    await getAccount(sourceKeys.publicKey()),
    {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    }
  )
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
  const transaction = new TransactionBuilder(
    await getAccount(sourceKeys.publicKey()),
    {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    }
  )
    .addOperation(
      Operation.payment({
        destination: destinationKey,
        asset: asset,
        amount: amount,
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeys);
  return submitTransaction(transaction);
}

export async function mergeAccount(accountSeed: string) {
  const destinationKeys = Keypair.fromSecret(accountSeed);
  const account = await getAccountData(destinationKeys.publicKey());
  let remainingCredits;
  account.balances.forEach((balance: any) => {
    if (balance.asset_code === assetCode) {
      remainingCredits = balance.balance;
    }
  });
  const transaction = new TransactionBuilder(
    new Account(account.id, account.sequence),
    {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    }
  )
    .addOperation(
      Operation.payment({
        destination: sourceKeys.publicKey(),
        asset: asset,
        amount: remainingCredits,
      })
    )
    .addOperation(
      Operation.changeTrust({
        asset: asset,
        limit: '0',
      })
    )
    .addOperation(
      Operation.accountMerge({
        destination: sourceKeys.publicKey(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(destinationKeys);
  return submitTransaction(transaction);
}

export async function accountCredits(publicAddress: string) {
  const { balances }: any = await getAccountData(publicAddress);

  const [currentBalance] = balances.filter(
    (balance: any) => balance.asset_code === assetCode
  );
  if (currentBalance && currentBalance.balance) {
    return parseFloat(currentBalance.balance);
  }
  return 0;
}

export async function payment(
  publicAddress: string,
  seed: string,
  amount: number
) {
  const sourceKeypair = Keypair.fromSecret(seed);
  const sourcePublicKey = sourceKeypair.publicKey();

  let transaction = new TransactionBuilder(await getAccount(sourcePublicKey), {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: publicAddress,
        asset: asset,
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
  let response = await getOrderbook(
    newAssetCode,
    sourceKeys.publicKey(),
    assetCode,
    sourceKeys.publicKey()
  );
  return response.asks[0];
}

export async function withdrawalFromAccount(seed: string, amount: number) {
  const sourceKeypair = Keypair.fromSecret(seed);
  const sourcePublicKey = sourceKeypair.publicKey();

  let transaction = new TransactionBuilder(await getAccount(sourcePublicKey), {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: sourceKeys.publicKey(),
        asset: asset,
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

export async function loadSkyhitzAssets(sourcePublicKey) {
  let { balances } = await getAccountData(sourcePublicKey);
  const assetCodes = balances
    .filter((balance: any) => {
      if (balance.asset_code !== assetCode && balance.asset_type !== 'native') {
        return true;
      }
      return false;
    })
    .map((ba: any) => ba.asset_code);
  return assetCodes;
}

export async function payUserInXLM(address: string, amount: number) {
  const sourcePublicKey = sourceKeys.publicKey();

  let transaction = new TransactionBuilder(await getAccount(sourcePublicKey), {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
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

export async function withdrawToExternalAddressAnchorUSD(
  address: string,
  amount: number,
  seed: string
) {
  const keys = Keypair.fromSecret(seed);
  const sourcePublicKey = keys.publicKey();

  let transaction = new TransactionBuilder(await getAccount(sourcePublicKey), {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: address,
        asset: asset,
        amount: amount.toFixed(6).toString(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(keys);
  let transactionResult = await submitTransaction(transaction);
  console.log('\nSuccess! View the transaction at: ', transactionResult);
  return transactionResult;
}