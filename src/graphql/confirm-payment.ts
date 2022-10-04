import { GraphQLString, GraphQLNonNull } from 'graphql';
import {
  deleteTransaction,
  getTransactionsByUser,
  getUserByPublicKey,
} from 'src/algolia/algolia';
import { getAuthenticatedUser } from 'src/auth/logic';
import { sendNftSoldEmail } from 'src/sendgrid/sendgrid';
import { getPublicKeyFromTransactionResult } from 'src/stellar/operations';
import SuccessResponse from './types/success-response';
import { sendNftBoughtEmail } from '../sendgrid/sendgrid';

// TODO fix that
const confirmPayment = {
  type: SuccessResponse,
  args: {
    resultXdr: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  async resolve(_: any, args: any, ctx: any) {
    try {
      const currentUser = await getAuthenticatedUser(ctx);

      const transactions = await getTransactionsByUser(currentUser.id);
      const transaction = transactions.find(
        (item) => item.xdr === args.resultXdr
      );
      if (!transaction) {
        throw 'Transaction could not be found';
      }

      const publicKey = getPublicKeyFromTransactionResult(transaction.xdr);
      const user = await getUserByPublicKey(publicKey);

      if (!user) {
        return {
          success: false,
          message: "Seller doesn't have an account on Skyhitz",
        };
      }

      Promise.all([
        sendNftSoldEmail(user.email),
        sendNftBoughtEmail(currentUser.email),
        deleteTransaction(transaction.objectID),
      ]);

      return { success: true, message: 'OK' };
    } catch (e) {
      console.log(e);
      throw e;
    }
  },
};

export default confirmPayment;
