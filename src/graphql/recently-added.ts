import { GraphQLList } from 'graphql';
import Entry from './types/entry';
import { getAuthenticatedUser } from '../auth/logic';
import { recentlyAdded } from 'src/algolia/algolia';

const RecentlyAdded = {
  type: new GraphQLList(Entry),
  async resolve(root: any, args: any, ctx: any) {
    await getAuthenticatedUser(ctx);

    return await recentlyAdded();
  },
};

export default RecentlyAdded;
