import { GraphQLList, GraphQLString } from 'graphql';
import Entry from './types/entry';
import { loadSkyhitzAssets } from '../stellar/operations';
import { getEntry, getEntryByCode, getUser } from '../algolia/algolia';

async function getEntriesWithAssetCodes(assetCodes: string[]) {
  return await Promise.all(assetCodes.map((id) => getEntryByCode(id)));
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
  async resolve(root: any, { id, userId }: any) {
    if (!userId) {
      const entry = await getEntry(id);
      return [entry];
    }

    let user = await getUser(userId);
    const assetCodes = await loadSkyhitzAssets(user.publicKey);
    return getEntriesWithAssetCodes(assetCodes);
  },
};

export default Entries;
