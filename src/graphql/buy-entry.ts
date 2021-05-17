import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLBoolean,
  GraphQLInt,
} from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { findCustomer } from '../payments/stripe';
import { accountCredits, manageBuyOffer } from '../payments/stellar';
import { getAll } from '../redis';

async function customerInfo(user: any) {
  let customer = await findCustomer(user.email);
  let credits = await accountCredits(customer.metadata.publicAddress);
  let userSeed = customer.metadata.seed;
  return { credits, userSeed };
}

const buyEntry = {
  type: GraphQLBoolean,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    amount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    price: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
  async resolve(_: any, args: any, ctx: any) {
    let { id, amount, price } = args;
    let user = await getAuthenticatedUser(ctx);

    let [{ credits, userSeed }, res] = [
      await customerInfo(user),
      await getAll(`assets:entry:${id}`),
    ];

    const [assetCode] = Object.keys(res);
    const total = price * amount;

    // fetch price from offer
    if (credits >= total) {
      // // send payment from buyer to owner of entry
      try {
        let transactionRecord = await manageBuyOffer(
          userSeed,
          amount,
          price / amount,
          assetCode
        );
        console.log(transactionRecord);
      } catch (e) {
        throw 'could not complete transaction';
      }
    }

    return true;
  },
};

export default buyEntry;
