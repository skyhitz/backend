import { GraphQLString, GraphQLBoolean, GraphQLNonNull } from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { entriesIndex } from '../algolia/algolia';
// import { getAll, hdel } from '../redis';
const adminId = '-LbM3m6WKdVQAsY3zrAd';

// TO DO: delete onwers of entry as well
async function deleteEntry(entry: any) {
  try {
    [
      // await hdel(`entries:${entry.id}`),
      await entriesIndex.deleteObject(entry.id),
    ];
  } catch (e) {
    console.log('error deleting entry:', e);
    return false;
  }

  return true;
}

const removeEntry = {
  type: GraphQLBoolean,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { id }: any, ctx: any) {
    const user = await getAuthenticatedUser(ctx);
    // let entry = await getAll(`entries:${id}`);
    let entry = await Promise.resolve(null);

    if (user.id === adminId) {
      return deleteEntry(entry);
    }

    // give permision if user is owner

    return false;
  },
};

export default removeEntry;
