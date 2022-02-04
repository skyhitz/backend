import { GraphQLString, GraphQLNonNull, GraphQLInt } from 'graphql';
import { getAuthenticatedUser } from '../auth/logic';
import { accountCredits, buyViaPathPayment } from '../stellar/operations';
import { getAll } from '../redis';
import { decrypt } from '../util/encryption';
import ConditionalXDR from './types/conditional-xdr';

async function customerInfo(user: any) {
  let credits = await accountCredits(user.publicKey);
  let userSeed = decrypt(user.seed);
  return { credits, seed: userSeed };
}

const buyEntry = {
  type: ConditionalXDR,
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

    let [{ credits, seed }, { code, issuer }] = [
      await customerInfo(user),
      await getAll(`entries:${id}`),
    ];

    const total = price * amount;

    // fetch price from offer
    if (credits >= total) {
      // // send payment from buyer to owner of entry
      try {
        if (seed) {
          return await buyViaPathPayment(
            user.publicKey,
            amount,
            price,
            code,
            issuer,
            seed
          );
        }

        return await buyViaPathPayment(
          user.publicKey,
          amount,
          price,
          code,
          issuer
        );
      } catch (e) {
        console.log(e);
        throw 'could not complete transaction';
      }
    }

    return { xdr: '', success: false, submitted: false };
  },
};

export default buyEntry;
