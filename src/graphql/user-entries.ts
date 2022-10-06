import { GraphQLList, GraphQLNonNull, GraphQLString } from 'graphql';
import Entry from './types/entry';
import { loadSkyhitzAssets } from '../stellar/operations';
import { getEntryByCode, getUser } from '../algolia/algolia';

async function getEntriesWithAssetCodes(assetCodes: string[]) {
  return await Promise.all(assetCodes.map((id) => getEntryByCode(id)));
}

export const UserEntries = {
  type: new GraphQLList(new GraphQLNonNull(Entry)),
  args: {
    userId: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(root: any, { userId }: any) {
    const user = await getUser(userId);
    const assetCodes = await loadSkyhitzAssets(user.publicKey);
    const entries = await getEntriesWithAssetCodes(assetCodes);

    return entries.filter((entry) => entry !== undefined);
  },
};
