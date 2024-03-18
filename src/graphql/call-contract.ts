import {
  Address,
  Keypair,
  Operation,
  StrKey,
  Transaction,
  hash,
  nativeToScVal,
  xdr,
} from 'stellar-base';

import { Contract, networks, Offer, Wallet } from 'skyhitz-soroban-client';
// import { getAuthenticatedUser } from '../auth/logic';
import { User } from 'src/util/types';
// import { decrypt } from 'src/util/encryption';

const pk = 'GD7BAZM73BXQTMRHA2JVJPE5X4AATOMOIXGA76N22JNTNMVXRQW5DR4B';

const sourceKeys = Keypair.fromSecret(
  'SB6NGNDLFKMRK4XW2W5OWFMJ2LIJ5SBXJU2X5TRSPXR2UNDOXHHZNKWY'
);

const customWallet: Wallet = {
  isConnected: async () => await true,
  isAllowed: async () => await true,
  getUserInfo: async () =>
    await {
      publicKey: pk,
    },
  signTransaction: async (tx: string, opts) => {
    const txFromXDR = new Transaction(tx, opts.networkPassphrase);

    txFromXDR.sign(sourceKeys);

    return txFromXDR.toXDR();
  },
  signAuthEntry: async (entryXdr, opts) => {
    console.log('entry xdr', entryXdr);
    console.log('options', opts);
    return (await sourceKeys.sign(
      hash(Buffer.from(entryXdr, 'base64'))
    )) as any;
  },
};

const skyhitz = new Contract({
  ...networks.testnet,
  rpcUrl: 'https://soroban-testnet.stellar.org', // from https://soroban.stellar.org/docs/reference/rpc-list#sdf-futurenet-and-testnet-only
  wallet: customWallet,
});

// const new_offer: Offer = {
//   amount: BigInt(100),
//   list_price: BigInt(1500),
//   mft: 'bafkreihwofyg6w6gvm5inzvsjoxyxwooafryhkhvsaoozla6hc2b43v56e',
// };

const new_offer: Offer = {
  amount: BigInt(90),
  list_price: BigInt(200),
  mft: 'bafkreihbc4nxtgvpltswmxovhj23vydtccudflhah3azlszjomnmvgpp4a',
};

const addOffer = async () => {
  const tx = await skyhitz.updateOffer({ new_offer });
  const res = await tx.signAndSend();
  return res.getTransactionResponse;
};

const getOffers = async () => {
  const tx = await skyhitz.getOffers();
  return tx.result;
};

const buy = async (mftHash: string, user?: User) => {
  // const buyerKeys = Keypair.fromSecret(decrypt(user.seed));

  // GBZP6P7QNKI342HNDUWXG5TE6DPIRIJBMERMZY5VCVHKVI67TJAYSK2C
  const buyerKeys = Keypair.fromSecret(
    'SC5FF7SJOUA3XVCSPIXEG6L2ORFHQ6BTVJBJH345W2GRSACKYIUXUDUP'
  );

  // get mft issuer with our logic
  const tx = await skyhitz.buy({
    buyer: buyerKeys.publicKey(),
    mft: mftHash,
    amount: BigInt(10),
  });

  console.log(await tx.needsNonInvokerSigningBy());

  const rawInvokeHostFunctionOp = tx.raw
    .operations[0] as Operation.InvokeHostFunction;

  const authEntries = rawInvokeHostFunctionOp.auth ?? [];

  for (const [i, entry] of authEntries.entries()) {
    if (
      entry.credentials().switch().name !==
      xdr.SorobanCredentialsType.sorobanCredentialsAddress().name
    ) {
      // if the invoker/source account, then the entry doesn't need explicit
      // signature, since the tx envelope is already signed by the source
      // account, so only check for sorobanCredentialsAddress
      continue;
    }
    const pk = StrKey.encodeEd25519PublicKey(
      entry.credentials().address().address().accountId().ed25519()
    );

    console.log('pk', pk);
    console.log('buyer public key', buyerKeys.publicKey());

    // this auth entry needs to be signed by a different account
    // (or maybe already was!)
    if (pk !== buyerKeys.publicKey()) continue;

    const validUntilLedgerSeq = await tx.getStorageExpiration();

    const addrAuth = entry.credentials().address();
    addrAuth.signatureExpirationLedger(validUntilLedgerSeq);

    const networkId = hash(Buffer.from(tx.options.networkPassphrase));
    const preimage = xdr.HashIdPreimage.envelopeTypeSorobanAuthorization(
      new xdr.HashIdPreimageSorobanAuthorization({
        networkId,
        nonce: addrAuth.nonce(),
        invocation: entry.rootInvocation(),
        signatureExpirationLedger: addrAuth.signatureExpirationLedger(),
      })
    );

    console.log(JSON.stringify(preimage));

    // this breaks: preimage.toXDR(), XDR Write Error: 2290679041439903971 is not a Hyper, where the number is coming from addrAuth.nonce();

    // const payload = hash(preimage.toXDR());

    const signature = buyerKeys.sign(hash(preimage.toXDR()));

    // const signature = Buffer.from(buyerKeys.sign(payload));

    const publicKey = Address.fromScAddress(addrAuth.address()).toString();

    // if (!Keypair.fromPublicKey(publicKey).verify(payload, signature)) {
    //   throw new Error(`signature doesn't match payload`);
    // }

    // This structure is defined here:
    // https://soroban.stellar.org/docs/fundamentals-and-concepts/invoking-contracts-with-transactions#stellar-account-signatures
    //
    // Encoding a contract structure as an ScVal means the map keys are supposed
    // to be symbols, hence the forced typing here.
    const sigScVal = nativeToScVal(
      {
        public_key: StrKey.decodeEd25519PublicKey(publicKey),
        signature,
      },
      {
        type: {
          public_key: ['symbol', null],
          signature: ['symbol', null],
        },
      }
    );

    addrAuth.signature(xdr.ScVal.scvVec([sigScVal]));

    authEntries[i] = entry;

    console.log('auth entries', authEntries);
  }

  const res = await tx.signAndSend();

  console.log('result', res.getTransactionResponse);

  return res.getTransactionResponse;
};

const deleteOffer = async (mftHash: string) => {
  const tx = await skyhitz.deleteOffer({ mft: mftHash });
  const res = await tx.signAndSend();
  return res.getTransactionResponse;
};

export const callContract = async (_: any, args: any, ctx: any) => {
  // const user = await getAuthenticatedUser(ctx);

  const { fn, mftHash } = args;

  switch (fn) {
    case 'updateOffer':
      return addOffer();

    case 'deleteOffer':
      return deleteOffer(mftHash);

    case 'getOffers':
      return getOffers();

    case 'buy':
      return buy(mftHash);
  }

  return {};
};
