import { Keypair, Transaction, hash, scValToNative, xdr } from 'stellar-base';
import { Contract, networks, Offer } from 'contract-client';
// import { getAuthenticatedUser } from '../auth/logic';
import { User } from 'src/util/types';
// import { decrypt } from 'src/util/encryption';
// import { Hyper } from '@stellar/js-xdr';

// const buyerKeys = Keypair.fromSecret(decrypt(user.seed));

// GBZP6P7QNKI342HNDUWXG5TE6DPIRIJBMERMZY5VCVHKVI67TJAYSK2C
const buyerKeys = Keypair.fromSecret(
  'SC5FF7SJOUA3XVCSPIXEG6L2ORFHQ6BTVJBJH345W2GRSACKYIUXUDUP'
);

// GD7BAZM73BXQTMRHA2JVJPE5X4AATOMOIXGA76N22JNTNMVXRQW5DR4B
const sourceKeys = Keypair.fromSecret(
  'SB6NGNDLFKMRK4XW2W5OWFMJ2LIJ5SBXJU2X5TRSPXR2UNDOXHHZNKWY'
);

function getClientForKeypair(keys: Keypair) {
  return new Contract({
    ...networks.testnet,
    rpcUrl: 'https://soroban-testnet.stellar.org', // from https://soroban.stellar.org/docs/reference/rpc-list#sdf-futurenet-and-testnet-only
    wallet: {
      isConnected: async () => await true,
      isAllowed: async () => await true,
      getUserInfo: async () =>
        await {
          publicKey: keys.publicKey(),
        },
      signTransaction: async (tx: string, opts) => {
        const txFromXDR = new Transaction(tx, opts.networkPassphrase);

        txFromXDR.sign(keys);

        return txFromXDR.toXDR();
      },
      signAuthEntry: async (entryXdr, opts) => {
        return keys
          .sign(hash(Buffer.from(entryXdr, 'base64')))
          .toString('base64');
      },
    },
  });
}

// const new_offer: Offer = {
//   amount: BigInt(100),
//   list_price: BigInt(1500),
//   mft: 'bafkreihwofyg6w6gvm5inzvsjoxyxwooafryhkhvsaoozla6hc2b43v56e',
// };

const new_offer: Offer = {
  amount: BigInt(90),
  list_price: BigInt(200),
  mft: 'GBCXC355SJCKNESJILVJWVDMURDGBYMXOCUBKSL73RQYM7RB6XB27PSW',
};

const addOffer = async () => {
  const contract = getClientForKeypair(sourceKeys);
  const tx = await contract.setOffer({ offer: new_offer });
  const res = await tx.signAndSend();
  return res.getTransactionResponse;
};

const getOffer = async (mft: string) => {
  const contract = getClientForKeypair(sourceKeys);
  const tx = await contract.getOffer({
    mft,
  });
  return tx.result;
};

const buy = async (mft: string, user?: User) => {
  const contract = getClientForKeypair(sourceKeys);

  // get mft issuer with our logic
  let tx = await contract.buy(
    {
      buyer: buyerKeys.publicKey(),
      mft: mft,
      amount: BigInt(10),
    },
    { fee: 100000000 }
  );

  console.log(await tx.needsNonInvokerSigningBy());

  const jsonFromRoot = tx.toJSON();

  console.log(tx.simulationData.transactionData.resources);

  const buyerClient = getClientForKeypair(buyerKeys);

  const txBuyer = buyerClient.fromJSON['buy'](jsonFromRoot);

  await txBuyer.signAuthEntries();

  const jsonFromBuyer = txBuyer.toJSON();

  const txRoot = contract.fromJSON['buy'](jsonFromBuyer);

  const result = await txRoot.signAndSend();

  // console.log('send res', result.sendTransactionResponseAll);
  // console.log('get res', result.getTransactionResponseAll);
  const getRes = result.getTransactionResponse as any;

  console.log(getRes.resultMetaXdr.toXDR('base64'));

  xdr.TransactionMeta.fromXDR(getRes.resultMetaXdr.toXDR('base64'), 'base64')
    .v3()
    .sorobanMeta()
    ?.diagnosticEvents()
    .forEach((event) => {
      // console.log(event);
      // console.log('event', event.event().body().v0().data().toXDR('base64'));
      console.log(scValToNative(event.event().body().v0().data()));
    });

  return result.getTransactionResponse;
};

const deleteOffer = async (mftHash: string) => {
  const contract = getClientForKeypair(sourceKeys);

  const tx = await contract.deleteOffer({ mft: mftHash });
  const res = await tx.signAndSend();
  return res.getTransactionResponse;
};

export const callContract = async (_: any, args: any, ctx: any) => {
  // const user = await getAuthenticatedUser(ctx);

  const { fn, mft } = args;

  switch (fn) {
    case 'updateOffer':
      return addOffer();

    case 'deleteOffer':
      return deleteOffer(mft);

    case 'getOffer':
      return getOffer(mft);

    case 'buy':
      return buy(mft);
  }

  return {};
};
