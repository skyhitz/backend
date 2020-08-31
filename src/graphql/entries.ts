import { GraphQLList, GraphQLString } from 'graphql';
import Entry from './types/entry';
import { getAuthenticatedUser } from '../auth/logic';
import { getAll } from '../redis';
import { each } from 'async';

function getEntries(entriesIds) {
  let entries = [];
  return new Promise((resolve, reject) => {
    each(
      entriesIds,
      async (entryId, cb) => {
        let entry = await getAll(`entries:${entryId}`);
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

    let userEntries = await getAll(`owners:user:${userId}`);
    let entries = await getEntries(Object.keys(userEntries));
    return entries;
  },
};

export default Entries;
