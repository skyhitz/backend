import { GraphQLObjectType, GraphQLString, GraphQLBoolean } from 'graphql';

const SuccessResponse: GraphQLObjectType = new GraphQLObjectType({
  name: 'SuccessResponse',
  description: 'This is a SuccessResponse',
  fields: () => {
    return {
      success: {
        type: GraphQLBoolean,
        resolve(object: any) {
          return object.success;
        },
      },
      message: {
        type: GraphQLString,
        resolve(object: any) {
          return object.message;
        },
      },
    };
  },
});

export default SuccessResponse;
