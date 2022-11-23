import { getUsersLikesWithEntryId } from '../algolia/algolia';

export const entryLikesResolver = async (_: any, { id }: any) => {
  const usersArr = await getUsersLikesWithEntryId(id);

  return {
    count: usersArr.length,
    users: usersArr.map(
      ({ avatarUrl, displayName, username, id, description }) => {
        return {
          avatarUrl: avatarUrl,
          displayName: displayName,
          username: username,
          id: id,
          description: description,
        };
      }
    ),
  };
};
