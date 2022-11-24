import { getAuthenticatedUser } from '../auth/logic';
import { getEntry, usersIndex } from '../algolia/algolia';

type SetLastPlayedEntryArgs = {
  entryId: String;
};

export const setLastPlayedEntryResolver = async (
  _: any,
  { entryId }: SetLastPlayedEntryArgs,
  ctx: any
) => {
  const user = await getAuthenticatedUser(ctx);
  const entry = await getEntry(entryId);
  if (!entry) return { success: false, message: 'Invalid entry id' };
  const userUpdate = {
    ...user,
    lastPlayedEntry: entry,
  };
  await usersIndex.partialUpdateObject(userUpdate);
  return true;
};
