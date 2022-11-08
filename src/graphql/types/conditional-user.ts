import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { GraphQLUser } from './user';

const ConditionalUser: GraphQLObjectType = new GraphQLObjectType({
  name: 'ConditionalUser',
  description: 'This is an ConditionalUser',
  fields: () => {
    return {
      user: {
        type: GraphQLUser,
        resolve(object: any) {
          return object.user;
        },
      },
      message: {
        type: new GraphQLNonNull(GraphQLString),
        resolve(object: any) {
          return object.message;
        },
      },
    };
  },
});

export default ConditionalUser;
