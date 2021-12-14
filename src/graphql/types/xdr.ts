import { GraphQLObjectType, GraphQLString } from 'graphql';

const XDR: GraphQLObjectType = new GraphQLObjectType({
  name: 'XDR',
  description: 'This is an XDR',
  fields: () => {
    return {
      xdr: {
        type: GraphQLString,
        resolve(xdr: string) {
          return xdr;
        },
      },
    };
  },
});

export default XDR;
