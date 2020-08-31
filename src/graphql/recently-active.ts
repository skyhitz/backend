import { GraphQLList } from 'graphql';
import PublicUser from './types/public-user';
import { getAuthenticatedUser } from '../auth/logic';
import { chunk } from '../util/chunk';
import { sendCommand } from '../redis';

const RecentlyActive = {
  type: new GraphQLList(PublicUser),
  async resolve(root: any, args: any, ctx: any) {
    let user = await getAuthenticatedUser(ctx);
    let key = user.testing === 'true' ? 'testing:all-users' : 'all-users';
    let users = await sendCommand('sort', [
      key,
      'limit',
      '0',
      '20',
      'by',
      'users:*->publishedAtTimestamp',
      'desc',
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

    return chunk(users, 5).map(
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
  },
};

export default RecentlyActive;
