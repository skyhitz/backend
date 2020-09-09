import { GraphQLObjectType, GraphQLBoolean, GraphQLFloat } from 'graphql';

const PaymentsInfoObject: GraphQLObjectType = new GraphQLObjectType({
  name: 'PaymentsInfo',
  description: 'Payments',
  fields: () => {
    return {
      subscribed: {
        type: GraphQLBoolean,
        resolve(paymentsInfo: any) {
          return paymentsInfo.subscribed;
        },
      },
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
