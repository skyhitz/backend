import { GraphQLObjectType, GraphQLString } from 'graphql';

const Token: GraphQLObjectType = new GraphQLObjectType({
  name: 'Token',
  description: 'Object that contains access token',
  fields: () => {
    return {
      token: {
        type: GraphQLString,
        resolve(token: any) {
          return token.token;
        },
      },
    };
  },
});

export default Token;
