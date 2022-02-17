import { GraphQLList, GraphQLString } from 'graphql';
import Entry from './types/entry';
import { getAuthenticatedUser } from '../auth/logic';
import { findCustomer } from '../payments/stripe';
import { loadSkyhitzAssets } from '../stellar/operations';
import { each } from 'async';
import { getEntry, getEntryByCode, getUser } from '../algolia/algolia';

function getEntriesWithAssetCodes(assetCodes) {
  let entries = [];
  return new Promise((resolve, reject) => {
    each(
      assetCodes,
      async (id, cb) => {
        let entry = await getEntryByCode(id);
        if (entry) {
          entries.push(entry);
          cb();
        } else {
          cb();
        }
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(entries);
        }
      }
    );
  });
}

const Entries = {
  type: new GraphQLList(Entry),
  args: {
    id: {
      type: GraphQLString,
    },
    userId: {
      type: GraphQLString,
    },
  },
  async resolve(root: any, { id, userId }: any, ctx: any) {
    await getAuthenticatedUser(ctx);
    if (!userId) {
      const entry = await getEntry(id);
      return [entry];
    }

    let user = await getUser(userId);
    if (!user.publicKey) {
      let customer = await findCustomer(user.email);
      let { metadata } = customer;
      let { publicAddress } = metadata;
      const assetCodes = await loadSkyhitzAssets(publicAddress);
      return getEntriesWithAssetCodes(assetCodes);
    }

    const assetCodes = await loadSkyhitzAssets(user.publicKey);
    return getEntriesWithAssetCodes(assetCodes);
  },
};

export default Entries;
