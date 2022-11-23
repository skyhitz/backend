import { sendNftBoughtEmail, sendNftSoldEmail } from '../sendgrid/sendgrid';
import { getEntry } from '../algolia/algolia';
import { getAuthenticatedUser } from '../auth/logic';
import { accountCredits, buyViaPathPayment } from '../stellar/operations';
import { decrypt } from '../util/encryption';
import { getPublicKeyFromTransactionResult } from '../stellar/operations';
import { getUserByPublicKey } from '../algolia/algolia';

async function customerInfo(user: any) {
  let { availableCredits: credits } = await accountCredits(user.publicKey);
  let userSeed = user.seed ? decrypt(user.seed) : '';
  return { credits, seed: userSeed };
}

export const buyEntryResolver = async (_: any, args: any, ctx: any) => {
  const { id, amount, price } = args;
  const user = await getAuthenticatedUser(ctx);

  const [{ credits, seed }, { code, issuer }] = [
    await customerInfo(user),
    await getEntry(id),
  ];

  const total = price * amount;

  if (credits >= total) {
    // // send payment from buyer to owner of entry
    try {
      if (seed) {
        const result = await buyViaPathPayment(
          user.publicKey,
          amount,
          price,
          code,
          issuer,
          seed
        );
        const publicKey = getPublicKeyFromTransactionResult(result.xdr);
        const seller = await getUserByPublicKey(publicKey);

        await sendNftBoughtEmail(user.email);

        if (seller) {
          await sendNftSoldEmail(seller.email);
        }

        return result;
      } else {
        const result = await buyViaPathPayment(
          user.publicKey,
          amount,
          price,
          code,
          issuer
        );
        return result;
      }
    } catch (ex) {
      console.log(ex);
      let message = 'There was an error during submitting a transaction';
      if (ex?.result_codes?.operations) {
        const opCodes: string[] = ex.result_codes.operations;
        if (opCodes.includes('op_over_source_max')) {
          message = 'Couldn not find an offer within the budget!';
        } else if (opCodes.includes('op_underfunded')) {
          message = 'Not enough funds on the account!';
        } else if (opCodes.includes('op_cross_self')) {
          message = 'You cannot buy a nft from yourself!';
        }
      }

      throw message;
    }
  }

  return { xdr: '', success: false, submitted: false };
};
