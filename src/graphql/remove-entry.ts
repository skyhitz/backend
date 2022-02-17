import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { deleteEntry } from '../algolia/algolia';
const adminId = '-LbM3m6WKdVQAsY3zrAd';

const removeEntry = {
  type: GraphQLBoolean,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { id }: any, ctx: any) {
    const user = await getAuthenticatedUser(ctx);

    if (user.id === adminId) {
      return deleteEntry(id);
    }

    // give permision if user is owner

    return false;
  },
};

export default removeEntry;
