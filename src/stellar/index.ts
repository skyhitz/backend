import {
  Keypair,
  Asset,
  TransactionBuilder,
  Memo,
  Operation,
  AuthImmutableFlag,
  Account,
  BASE_FEE,
  Transaction,
} from 'skyhitz-stellar-base';
import { Config } from '../config';
import { getConfig, getAccount } from './utils';

export async function buildNFTTransaction(
  accountPublicKey: string,
  issuerKey: Keypair,
  code: string,
  supply: number,
  cid: string,
  buildAndSign = true
) {
  const issuerPublicKey = issuerKey.publicKey();
  const asset = new Asset(code, issuerPublicKey);

  const account = await (async () => {
    try {
      return await getAccount(accountPublicKey);
    } catch {
      throw new Error(
        `Your account ${accountPublicKey} does not exist on the Stellar ${
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
  )
    .setTimeout(300)
    .addMemo(Memo.text(`Skyhitz - Music NFTs✨`))
    .addOperation(
      Operation.beginSponsoringFutureReserves({
        sponsoredId: issuerPublicKey,
      })
    )
    .addOperation(
      Operation.createAccount({
        destination: issuerPublicKey,
        startingBalance: '0',
      })
    )

    .addOperation(
      Operation.manageData({
        source: issuerPublicKey,
        name: `ipfshash`,
        value: cid,
      })
    )

    .addOperation(
      Operation.endSponsoringFutureReserves({
        source: issuerPublicKey,
      })
    )
    .addOperation(
      Operation.changeTrust({ asset: asset, limit: supply.toString() })
    )
    .addOperation(
      Operation.payment({
        source: issuerPublicKey,
        destination: accountPublicKey,
        asset: asset,
        amount: supply.toString(),
      })
    )
    .addOperation(
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

  let xdr = '';

  if (buildAndSign) {
    const transactionBuilt = transaction.build();
    transactionBuilt.sign(issuerKey);
    xdr = transactionBuilt.toXDR();
    console.log(`Transaction built: ${xdr}`);
  }

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

export function verifySourceSignatureOnXDR(xdr: string) {
  const txFromXDR = new Transaction(xdr, getConfig().networkPassphrase);
  const hashedSignatureBase = txFromXDR.hash();
  const [signature] = JSON.parse(JSON.stringify(txFromXDR.signatures));
  const keypair = Keypair.fromPublicKey(txFromXDR.source);
  return {
    verified: keypair.verify(hashedSignatureBase, signature.signature()),
    source: txFromXDR.source,
  };
}
