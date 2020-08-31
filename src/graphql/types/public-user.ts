import { GraphQLObjectType, GraphQLString } from 'graphql';

const PublicUser: GraphQLObjectType = new GraphQLObjectType({
  name: 'PublicUser',
  description: 'This represents a User',
  fields: () => {
    return {
      avatarUrl: {
        type: GraphQLString,
        resolve(user: any) {
          return user.avatarUrl;
        },
      },
      displayName: {
        type: GraphQLString,
        resolve(user: any) {
          return user.displayName;
        },
      },
      username: {
        type: GraphQLString,
        resolve(user: any) {
          return user.username;
        },
      },
      id: {
        type: GraphQLString,
        resolve(user: any) {
          return user.id;
        },
      },
      description: {
        type: GraphQLString,
        resolve(user: any) {
          return user.description;
        },
      },
    };
  },
});

export default PublicUser;
