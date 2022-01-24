import { GraphQLString } from 'graphql';
import User from './types/user';
import { getAuthenticatedUser } from '../auth/logic';
import { usersIndex } from '../algolia/algolia';
import { updateUser } from '../redis';

const updateUserEndpoint = {
  type: User,
  args: {
    avatarUrl: {
      type: GraphQLString,
    },
    displayName: {
      type: GraphQLString,
    },
    description: {
      type: GraphQLString,
    },
    username: {
      type: GraphQLString,
    },
    email: {
      type: GraphQLString,
    },
  },
  async resolve(
    _: any,
    { avatarUrl, displayName, description, username, email }: any,
    ctx: any
  ) {
    let user = await getAuthenticatedUser(ctx);
    if (user.avatarUrl === 'null') {
      user.avatarUrl = null;
    } else {
      user.avatarUrl = avatarUrl;
    }
    user.displayName = displayName;
    user.description = description;
    user.username = username.toLowerCase();
    user.email = email;
    let userIndexObject: any = {
      avatarUrl: user.avatarUrl,
      displayName: user.displayName,
      description: user.description,
      reputation: user.reputation,
      username: user.username,
      id: user.id,
      userType: user.userType,
      publishedAt: user.publishedAt,
      publishedAtTimestamp: user.publishedAtTimestamp,
      objectID: user.id,
      testing: user.testing === 'true',
    };
    [
      await updateUser(user),
      await usersIndex.partialUpdateObject(userIndexObject),
    ];
    return user;
  },
};

export default updateUserEndpoint;
