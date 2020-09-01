import { GraphQLNonNull, GraphQLString } from 'graphql';
import EntryLikes from './types/entry-likes';
import { getAuthenticatedUser } from '../auth/logic';
import { sendCommand } from '../redis';
import { chunk } from '../util/chunk';

const entryLikes = {
  type: EntryLikes,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, { id }: any, ctx: any) {
    await getAuthenticatedUser(ctx);
    let users = await sendCommand('sort', [
      `likes:entry:${id}`,
      'by',
      'nosort',
      'get',
      'users:*->avatarUrl',
      'get',
      'users:*->displayName',
      'get',
      'users:*->username',
      'get',
      'users:*->id',
      'get',
      'users:*->description',
    ]);

    let usersArr = chunk(users, 5).map(
      ([avatarUrl, displayName, username, id, description]) => {
        return {
          avatarUrl: avatarUrl,
          displayName: displayName,
          username: username,
          id: id,
          description: description,
        };
      }
    );

    return {
      count: usersArr.length,
      users: usersArr,
    };
  },
};

export default entryLikes;
