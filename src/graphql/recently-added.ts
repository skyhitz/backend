import { GraphQLInt, GraphQLList } from 'graphql';
import Entry from './types/entry';
import { recentlyAdded } from '../algolia/algolia';

const RecentlyAdded = {
  type: new GraphQLList(Entry),
  args: {
    page: {
      type: GraphQLInt,
    },
  },
  async resolve(root: any, { page }: any) {
    return await recentlyAdded(page);
  },
};

export default RecentlyAdded;
