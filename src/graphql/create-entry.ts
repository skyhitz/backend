import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
} from 'graphql';

import { getAuthenticatedUser } from '../auth/logic';
// import { entriesIndex } from '../algolia/algolia';
import { openSellOffer } from '../stellar/operations';
// import { setEntry, getAll } from '../redis';
// import { getAll } from '../redis';

import { buildNFTTransaction } from '../stellar/index';
import XDR from './types/xdr';
import { Keypair } from 'skyhitz-stellar-base';
import { getIssuer } from '../algolia/algolia';
// import { generateTomlFile } from '../stellar/toml';

// async function indexEntryToDb({
//   cid,
//   imageUrl,
//   description,
//   title,
//   artist,
//   videoUrl,
//   forSale,
//   price,
//   equityForSale,
//   code,
//   issuer,
//   supply,
//   user,
// }) {
//   let entry = {
//     id: cid,
//     imageUrl: imageUrl,
//     description: description,
//     title: title,
//     artist: artist,
//     videoUrl: videoUrl,
//     publishedAt: new Date().toISOString(),
//     publishedAtTimestamp: Math.floor(new Date().getTime() / 1000),
//     forSale: forSale,
//     price: price,
//     equityForSale: equityForSale,
//     code: code,
//     issuer: issuer,
//   };
//   let entryIndex: any = entry;
//   entryIndex.userDisplayName = user.displayName;
//   entryIndex.userUsername = user.username;
//   entryIndex.objectID = cid;

//   await Promise.all([
//     await setEntry(
//       entry,
//       generateTomlFile({
//         code,
//         issuer: issuer,
//         description,
//         name: `${artist} - ${title}`,
//         image: imageUrl,
//         supply,
//       })
//     ),
//     await entriesIndex.addObject(entryIndex),
//   ]);
// }

const createEntry = {
  type: XDR,
  args: {
    cid: {
      type: new GraphQLNonNull(GraphQLString),
    },
    imageUrl: {
      type: new GraphQLNonNull(GraphQLString),
    },
    videoUrl: {
      type: new GraphQLNonNull(GraphQLString),
    },
    code: {
      type: new GraphQLNonNull(GraphQLString),
    },
    description: {
      type: new GraphQLNonNull(GraphQLString),
    },
    title: {
      type: new GraphQLNonNull(GraphQLString),
    },
    artist: {
      type: new GraphQLNonNull(GraphQLString),
    },
    forSale: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
    price: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    equityForSale: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
  },
  async resolve(
    _: any,
    {
      cid,
      imageUrl,
      videoUrl,
      code,
      description,
      title,
      artist,
      forSale,
      price,
      equityForSale,
    }: any,
    ctx: any
  ) {
    let user = await getAuthenticatedUser(ctx);

    const issuer = await getIssuer(user.id);
    if (!issuer) {
      throw 'issuer not set';
    }
    const issuerKey = Keypair.fromSecret(issuer.seed);
    const supply = 1;

    const { transaction, xdr } = await buildNFTTransaction(
      user.publicKey,
      issuerKey,
      code,
      supply,
      cid
    );

    if (user.publicKey && forSale) {
      const sellXdr = await openSellOffer(
        transaction,
        issuerKey,
        code,
        user.publicKey,
        equityForSale,
        price / equityForSale
      );
      return sellXdr;
    }

    return xdr;
  },
};

export default createEntry;
