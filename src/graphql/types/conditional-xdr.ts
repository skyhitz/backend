import { GraphQLObjectType, GraphQLString, GraphQLBoolean } from 'graphql';

const ConditionalXDR: GraphQLObjectType = new GraphQLObjectType({
  name: 'ConditionalXDR',
  description: 'This is an ConditionalXDR',
  fields: () => {
    return {
      xdr: {
        type: GraphQLString,
        resolve(object: any) {
          return object.xdr;
        },
      },
      success: {
        type: GraphQLBoolean,
        resolve(object: any) {
          return object.success;
        },
      },
      submitted: {
        type: GraphQLBoolean,
        resolve(object: any) {
          return object.submitted;
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

export default ConditionalXDR;
