import { GraphQLObjectType, GraphQLFloat } from 'graphql';

const PaymentsInfoObject: GraphQLObjectType = new GraphQLObjectType({
  name: 'PaymentsInfo',
  description: 'Payments',
  fields: () => {
    return {
      credits: {
        type: GraphQLFloat,
        resolve(paymentsInfo: any) {
          return paymentsInfo.credits;
        },
      },
    };
  },
});

export default PaymentsInfoObject;
