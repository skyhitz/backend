import { GraphQLObjectType, GraphQLString, GraphQLBoolean } from 'graphql';

export const IndexEntryResult: GraphQLObjectType = new GraphQLObjectType({
  name: 'IndexEntryResult',
  description: 'Result of the indexEntry mutation',
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
