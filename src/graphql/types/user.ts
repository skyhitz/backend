import {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql';

const User: GraphQLObjectType = new GraphQLObjectType({
  name: 'User',
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
      email: {
        type: GraphQLString,
        resolve(user: any) {
          return user.email;
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
      publishedAt: {
        type: GraphQLString,
        resolve(user: any) {
          return user.publishedAt;
        },
      },
      version: {
        type: GraphQLInt,
        resolve(user: any) {
          return user.version;
        },
      },
      jwt: {
        type: GraphQLString,
        resolve(user: any) {
          return user.jwt;
        },
      },
      description: {
        type: GraphQLString,
        resolve(user: any) {
          return user.description;
        },
      },
      testing: {
        type: GraphQLBoolean,
        resolve(user: any) {
          return user.testing;
        },
      },
    };
  },
});

export default User;
