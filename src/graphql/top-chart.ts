import { GraphQLInt, GraphQLList } from 'graphql';
import Entry from './types/entry';
import { entriesByLikeCount } from '../algolia/algolia';

const TopChart = {
  type: new GraphQLList(Entry),
  args: {
    page: {
      type: GraphQLInt,
    },
  },
  async resolve(root: any, { page }: any) {
    return await entriesByLikeCount(page);
  },
};

export default TopChart;
