import {
  Keypair,
  Asset,
  Memo,
  Operation,
  AuthImmutableFlag,
  Transaction,
} from 'skyhitz-stellar-base';
import { Config } from '../config';
import { buildTransactionWithFee } from './operations';
import { getConfig } from './utils';

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
  const appDomain = Config.APP_URL.replace('https://', '');

  const transaction = (await buildTransactionWithFee(accountPublicKey))
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
        homeDomain: appDomain,
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
  const [signature] = txFromXDR.signatures;
  const keypair = Keypair.fromPublicKey(txFromXDR.source);
  return {
    verified: keypair.verify(hashedSignatureBase, signature.signature()),
    source: txFromXDR.source,
  };
}
