import {
  Keypair,
  Asset,
  TransactionBuilder,
  Memo,
  Operation,
  AuthImmutableFlag,
  Account,
  BASE_FEE,
} from 'skyhitz-stellar-base';
import { Config } from '../config';
// import { Config } from '../config';
import { getConfig, getAccount } from './utils';

export async function buildNFTTransaction(
  accountPublicKey: string,
  issuerKey: Keypair,
  code: string,
  supply: number,
  cid: string
) {
  const issuerPublicKey = issuerKey.publicKey();
  const asset = new Asset(code, issuerPublicKey);

  const account = await (async () => {
    try {
      return await getAccount(accountPublicKey);
    } catch {
      throw new Error(
        `Your account ${issuerPublicKey} does not exist on the Stellar ${
          getConfig().network
        } network. It must be created before it can be used to submit transactions.`
      );
    }
  })();

  const transaction = new TransactionBuilder(
    new Account(account.id, account.sequence),
    {
      fee: BASE_FEE,
      networkPassphrase: getConfig().networkPassphrase,
    }
  );
  transaction.setTimeout(300);
  transaction.addMemo(Memo.text(`Create ${code} NFT ✨`));
  transaction.addOperation(
    Operation.beginSponsoringFutureReserves({
      sponsoredId: issuerPublicKey,
    })
  );
  transaction.addOperation(
    Operation.createAccount({
      destination: issuerPublicKey,
      startingBalance: '0',
    })
  );

  transaction.addOperation(
    Operation.manageData({
      source: issuerPublicKey,
      name: `ipfshash`,
      value: cid,
    })
  );

  transaction.addOperation(
    Operation.endSponsoringFutureReserves({
      source: issuerPublicKey,
    })
  );
  transaction.addOperation(
    Operation.changeTrust({ asset: asset, limit: supply.toString() })
  );
  transaction.addOperation(
    Operation.payment({
      source: issuerPublicKey,
      destination: accountPublicKey,
      asset: asset,
      amount: supply.toString(),
    })
  );
  transaction.addOperation(
    Operation.setOptions({
      source: issuerPublicKey,
      setFlags: AuthImmutableFlag,
      masterWeight: 0,
      lowThreshold: 0,
      medThreshold: 0,
      highThreshold: 0,
      homeDomain:
        Config.ENV === 'production' ? `skyhitz.io` : `vice.skyhitz.io`,
    })
  );

  const transactionBuilt = transaction.build();
  transactionBuilt.sign(issuerKey);
  const xdr = transactionBuilt.toEnvelope().toXDR('base64');
  console.log(`Transaction built: ${xdr}`);

  return {
    code,
    issuer: issuerPublicKey,
    issuerKey,
    transaction,
    xdr,
    supply,
    cid,
  };
}
