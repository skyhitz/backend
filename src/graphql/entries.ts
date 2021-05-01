import { GraphQLList, GraphQLString } from 'graphql';
import Entry from './types/entry';
import { getAuthenticatedUser } from '../auth/logic';
import { getAll } from '../redis';
import { findCustomer } from '../payments/stripe';
import { loadSkyhitzAssets } from '../payments/stellar';

import { each } from 'async';

function getEntriesWithAssetCodes(assetCodes) {
  let entries = [];
  return new Promise((resolve, reject) => {
    each(
      assetCodes,
      async (id, cb) => {
        let res = await getAll(`assets:code:${id}`);
        const [entryId] = Object.keys(res);
        const entry = await getAll(`entries:${entryId}`);
        entries.push(entry);
        cb();
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
      return getAll(`entries:${id}`);
    }

    let user = await getAll(`users:${userId}`);
    let customer = await findCustomer(user.email);
    let { metadata } = customer;
    let { publicAddress } = metadata;
    const assetCodes = await loadSkyhitzAssets(publicAddress);
    return getEntriesWithAssetCodes(assetCodes);
  },
};

export default Entries;
