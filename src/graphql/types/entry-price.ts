import { GraphQLObjectType, GraphQLString } from 'graphql';

const EntryPrice: GraphQLObjectType = new GraphQLObjectType({
  name: 'EntryPrice',
  description: 'This is an Entry Price',
  fields: () => {
    return {
      price: {
        type: GraphQLString,
        resolve(entry: any) {
          return entry.price;
        },
      },
      amount: {
        type: GraphQLString,
        resolve(entry: any) {
          return entry.amount;
        },
      },
    };
  },
});

export default EntryPrice;
