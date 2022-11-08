import { GraphQLNonNull, GraphQLString } from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import SuccessResponse from './types/success-response';
import { getEntry, usersIndex } from '../algolia/algolia';

type SetLastPlayedEntryArgs = {
  entryId: String;
};

const setLastPlayedEntry = {
  type: SuccessResponse,
  args: {
    entryId: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { entryId }: SetLastPlayedEntryArgs, ctx: any) {
    const user = await getAuthenticatedUser(ctx);
    const entry = await getEntry(entryId);
    if (!entry) return { success: false, message: 'Invalid entry id' };
    const userUpdate = {
      ...user,
      lastPlayedEntry: entry,
    };
    await usersIndex.partialUpdateObject(userUpdate);
    return { success: true, message: 'OK' };
  },
};

export default setLastPlayedEntry;
