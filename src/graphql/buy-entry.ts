import { GraphQLString, GraphQLNonNull, GraphQLFloat } from 'graphql';
import { sendNftBoughtEmail } from 'src/sendgrid/sendgrid';
import { getEntry } from '../algolia/algolia';
import { getAuthenticatedUser } from '../auth/logic';
import { accountCredits, buyViaPathPayment } from '../stellar/operations';
import { decrypt } from '../util/encryption';
import ConditionalXDR from './types/conditional-xdr';

async function customerInfo(user: any) {
  let { availableCredits: credits } = await accountCredits(user.publicKey);
  let userSeed = user.seed ? decrypt(user.seed) : '';
  return { credits, seed: userSeed };
}

const buyEntry = {
  type: ConditionalXDR,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
    amount: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
    price: {
      type: new GraphQLNonNull(GraphQLFloat),
    },
  },
  async resolve(_: any, args: any, ctx: any) {
    let { id, amount, price } = args;
    let user = await getAuthenticatedUser(ctx);

    let [{ credits, seed }, { code, issuer }] = [
      await customerInfo(user),
      await getEntry(id),
    ];

    const total = price * amount;

    // fetch price from offer
    if (credits >= total) {
      // // send payment from buyer to owner of entry
      try {
        if (seed) {
          await buyViaPathPayment(
            user.publicKey,
            amount,
            price,
            code,
            issuer,
            seed
          );
          await sendNftBoughtEmail(user.email);
          return;
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
