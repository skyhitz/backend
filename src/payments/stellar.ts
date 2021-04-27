import StellarSdkLibrary = require('stellar-sdk');
import { Config } from '../config';
export const BASE_FEE = '102';
export const stellarServer = new StellarSdkLibrary.Server(Config.HORIZON_URL);
export const StellarSdk = StellarSdkLibrary;
export const sourceKeys = StellarSdk.Keypair.fromSecret(Config.ISSUER_SEED);
let assetCode;
let asset;

if (Config.ENV === 'production') {
  assetCode = 'USD';
  asset = new StellarSdk.Asset(
    'USD',
    'GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX'
  );
} else {
  assetCode = 'USDTEST';
  asset = new StellarSdk.Asset(assetCode, sourceKeys.publicKey());
}

const XLM = StellarSdk.Asset.native();

const NETWORK_PASSPHRASE =
  Config.ENV === 'production'
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

export async function accountExists(publicKey: string) {
  try {
    await stellarServer.loadAccount(publicKey);
  } catch (e) {
    return false;
  }
  return true;
}

export async function fundAccount(destinationKey: string) {
  if (!destinationKey) {
    throw 'Account does not exist';
  }
  let sourceAccount = await stellarServer.loadAccount(sourceKeys.publicKey());
  let transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.createAccount({
        destination: destinationKey,
        startingBalance: '1',
      })
    )
    .setTimeout(0)
    .build();
  transaction.sign(sourceKeys);
  return stellarServer.submitTransaction(transaction);
}

export async function createAndFundAccount() {
  let pair = StellarSdk.Keypair.random();
  let secret = pair.secret();
  let publicAddress = pair.publicKey();
  try {
    await fundAccount(publicAddress);
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

export async function issueAssetAndOpenSellOffer(
  destinationSeed: string,
  assetCode: string,
  amount: number,
  price: number
) {
  const limitOfShares = '100';
  const newAsset = new StellarSdk.Asset(assetCode, sourceKeys.publicKey());
  const destinationKeys = StellarSdk.Keypair.fromSecret(destinationSeed);
  const account = await stellarServer.loadAccount(sourceKeys.publicKey());
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      StellarSdk.Operation.changeTrust({
        asset: newAsset,
        limit: limitOfShares,
        source: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      StellarSdk.Operation.endSponsoringFutureReserves({
        source: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationKeys.publicKey(),
        asset: newAsset,
        amount: limitOfShares,
      })
    )
    .addOperation(
      StellarSdk.Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      StellarSdk.Operation.manageSellOffer({
        selling: newAsset,
        buying: asset,
        amount: amount.toString(),
        price: price.toString(),
        source: destinationKeys.publicKey(),
        offerId: 0,
      })
    )
    .addOperation(
      StellarSdk.Operation.endSponsoringFutureReserves({
        source: destinationKeys.publicKey(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeys, destinationKeys);
  let transactionResult = await stellarServer.submitTransaction(transaction);
  return transactionResult;
}

export async function manageBuyOffer(
  destinationSeed: string,
  amount: number,
  price: number,
  assetCode: string
) {
  const destinationKeys = StellarSdk.Keypair.fromSecret(destinationSeed);
  const account = await stellarServer.loadAccount(sourceKeys.publicKey());
  const newAsset = new StellarSdk.Asset(assetCode, sourceKeys.publicKey());

  // price of 1 unit in terms of buying, 100 will be 100 usd per one share
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      StellarSdk.Operation.manageBuyOffer({
        selling: asset,
        buying: newAsset,
        buyAmount: amount.toString(),
        price: price.toString(),
        source: destinationKeys.publicKey(),
        offerId: 0,
      })
    )
    .addOperation(
      StellarSdk.Operation.endSponsoringFutureReserves({
        source: destinationKeys.publicKey(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeys, destinationKeys);
  let transactionResult = await stellarServer.submitTransaction(transaction);
  return transactionResult;
}

export async function getOfferId(sellingAccount, assetCode) {
  const sellingAsset = new StellarSdk.Asset(assetCode, sourceKeys.publicKey());

  let offers = await stellarServer
    .offers()
    .forAccount(sellingAccount)
    .selling(sellingAsset)
    .call();

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
  const destinationKeys = StellarSdk.Keypair.fromSecret(destinationSeed);
  const account = await stellarServer.loadAccount(sourceKeys.publicKey());
  const newAsset = new StellarSdk.Asset(assetCode, sourceKeys.publicKey());

  // price of 1 unit in terms of buying, 100 will be 100 usd per one share
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      StellarSdk.Operation.manageSellOffer({
        selling: newAsset,
        buying: asset,
        amount: amount.toString(),
        price: price.toString(),
        source: destinationKeys.publicKey(),
        offerId: offerId,
      })
    )
    .addOperation(
      StellarSdk.Operation.endSponsoringFutureReserves({
        source: destinationKeys.publicKey(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeys, destinationKeys);
  let transactionResult = await stellarServer.submitTransaction(transaction);
  return transactionResult;
}

export async function allowTrust(destinationSeed: string) {
  const destinationKeys = StellarSdk.Keypair.fromSecret(destinationSeed);
  const account = await stellarServer.loadAccount(sourceKeys.publicKey());
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      StellarSdk.Operation.changeTrust({
        asset: asset,
        source: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      StellarSdk.Operation.endSponsoringFutureReserves({
        source: destinationKeys.publicKey(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeys, destinationKeys);
  let transactionResult = await stellarServer.submitTransaction(transaction);
  return transactionResult;
}

export async function sendOwnershipOfAsset(
  destinationSeed: string,
  assetCode: string
) {
  const limitOfShares = '100';
  const newAsset = new StellarSdk.Asset(assetCode, sourceKeys.publicKey());
  const destinationKeys = StellarSdk.Keypair.fromSecret(destinationSeed);
  const account = await stellarServer.loadAccount(sourceKeys.publicKey());
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.beginSponsoringFutureReserves({
        sponsoredId: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      StellarSdk.Operation.changeTrust({
        asset: newAsset,
        limit: limitOfShares,
        source: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      StellarSdk.Operation.endSponsoringFutureReserves({
        source: destinationKeys.publicKey(),
      })
    )
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationKeys.publicKey(),
        asset: newAsset,
        amount: limitOfShares,
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeys, destinationKeys);
  let transactionResult = await stellarServer.submitTransaction(transaction);
  return transactionResult;
}

export async function sendSubscriptionTokens(
  destinationKey: string,
  amount: string
) {
  const sourceAccount = await stellarServer.loadAccount(sourceKeys.publicKey());
  const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationKey,
        asset: asset,
        amount: amount,
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeys);
  return stellarServer.submitTransaction(transaction);
}

export async function mergeAccount(accountSeed: string) {
  const destinationKeys = StellarSdk.Keypair.fromSecret(accountSeed);
  const account = await stellarServer.loadAccount(destinationKeys.publicKey());
  let remainingCredits;
  account.balances.forEach((balance: any) => {
    if (balance.asset_code === assetCode) {
      remainingCredits = balance.balance;
    }
  });
  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: sourceKeys.publicKey(),
        asset: asset,
        amount: remainingCredits,
      })
    )
    .addOperation(
      StellarSdk.Operation.changeTrust({
        asset: asset,
        limit: '0',
      })
    )
    .addOperation(
      StellarSdk.Operation.accountMerge({
        destination: sourceKeys.publicKey(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(destinationKeys);
  return stellarServer.submitTransaction(transaction);
}

export async function accountCredits(publicAddress: string) {
  const { balances }: any = await stellarServer
    .accounts()
    .accountId(publicAddress)
    .call();

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
  const sourceKeypair = StellarSdk.Keypair.fromSecret(seed);
  const sourcePublicKey = sourceKeypair.publicKey();

  let account = await stellarServer.loadAccount(sourcePublicKey);
  let transaction = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: publicAddress,
        asset: asset,
        amount: amount.toString(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeypair);
  let transactionResult = await stellarServer.submitTransaction(transaction);
  console.log('\nSuccess! View the transaction at: ', transactionResult);
  return transactionResult;
}

export async function getUSDPrice() {
  let response = await stellarServer.orderbook(asset, XLM).call();
  return response.bids[0].price;
}

export async function getUSDPriceForAsset(assetCode) {
  const newAsset = new StellarSdk.Asset(assetCode, sourceKeys.publicKey());
  let response = await stellarServer.orderbook(newAsset, asset).call();
  return response.bids[0].price;
}

export async function convertUSDtoXLM(USDAmount: number) {
  if (Config.ENV === 'production') {
    const currentPrice = await getUSDPrice();
    const XLMAmount = USDAmount * parseInt(currentPrice);
    return XLMAmount;
  }
  // using 12.5 cents as reference
  return USDAmount * 12.5;
}

export async function withdrawalFromAccount(seed: string, amount: number) {
  const sourceKeypair = StellarSdk.Keypair.fromSecret(seed);
  const sourcePublicKey = sourceKeypair.publicKey();

  let account = await stellarServer.loadAccount(sourcePublicKey);
  let transaction = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: sourceKeys.publicKey(),
        asset: asset,
        amount: amount.toString(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeypair);
  let transactionResult = await stellarServer.submitTransaction(transaction);
  console.log('\nSuccess! View the transaction at: ', transactionResult);
  return transactionResult;
}

export async function loadSkyhitzAssets(sourcePublicKey) {
  let { balances } = await stellarServer.loadAccount(sourcePublicKey);
  const assetCodes = balances
    .filter((balance: any) => {
      if (balance.asset_code !== assetCode && balance.asset_code !== 'XLM') {
        return true;
      }
      return false;
    })
    .map((ba: any) => ba.asset_code);
  return assetCodes;
}

export async function payUserInXLM(address: string, amount: number) {
  const sourcePublicKey = sourceKeys.publicKey();

  let account = await stellarServer.loadAccount(sourcePublicKey);
  let transaction = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: address,
        asset: XLM,
        amount: amount.toFixed(6).toString(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(sourceKeys);
  let transactionResult = await stellarServer.submitTransaction(transaction);
  console.log('\nSuccess! View the transaction at: ', transactionResult);
  return transactionResult;
}

export async function withdrawToExternalAddressAnchorUSD(
  address: string,
  amount: number,
  seed: string
) {
  const keys = StellarSdk.Keypair.fromSecret(seed);
  const sourcePublicKey = keys.publicKey();

  let account = await stellarServer.loadAccount(sourcePublicKey);
  let transaction = new StellarSdk.TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: address,
        asset: asset,
        amount: amount.toFixed(6).toString(),
      })
    )
    .setTimeout(0)
    .build();

  transaction.sign(keys);
  let transactionResult = await stellarServer.submitTransaction(transaction);
  console.log('\nSuccess! View the transaction at: ', transactionResult);
  return transactionResult;
}
