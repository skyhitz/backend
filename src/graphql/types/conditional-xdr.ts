import { GraphQLObjectType, GraphQLString, GraphQLBoolean } from 'graphql';

const ConditionalXDR: GraphQLObjectType = new GraphQLObjectType({
  name: 'ConditionalXDR',
  description: 'This is an ConditionalXDR',
  fields: () => {
    return {
      xdr: {
        type: GraphQLString,
        resolve(xdr: string) {
          return xdr;
        },
      },
      success: {
        type: GraphQLBoolean,
        resolve(success: boolean) {
          return success;
        },
      },
      submitted: {
        type: GraphQLBoolean,
        resolve(submitted: boolean) {
          return submitted;
        },
      },
    };
  },
});

export default ConditionalXDR;
