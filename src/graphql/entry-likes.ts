import { GraphQLNonNull, GraphQLString } from 'graphql';
import EntryLikes from './types/entry-likes';
import { getAuthenticatedUser } from '../auth/logic';
import { getUsersLikesWithEntryId } from '../algolia/algolia';

const entryLikes = {
  type: EntryLikes,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { id }: any, ctx: any) {
    await getAuthenticatedUser(ctx);

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
  },
};

export default entryLikes;
