import { CustomerPayload, BuyCreditsPayload } from './types';
import {
  cancelSubscription,
  createOrFindCustomer,
  findCustomer,
  createCustomerWithEmail,
} from './stripe';
import { createAndFundAccount, mergeAccount, allowTrust } from './stellar';

export async function buyCreditsWithCard(payload: BuyCreditsPayload) {
  try {
    await createOrFindCustomer({
      email: payload.email,
      cardToken: payload.cardToken,
      pendingCharge: payload.amount.toString(),
    });
  } catch (e) {
    throw e;
  }
}

export async function subscribe(customerPayload: CustomerPayload) {
  try {
    await createOrFindCustomer({
      ...customerPayload,
      subscribe: 'true',
    });
  } catch (e) {
    throw e;
  }
}

export async function cancel(email: string) {
  let { seed } = await cancelSubscription(email);
  await mergeAccount(seed);
}

// TODO: use Redis as main source for encrypted info
export async function checkIfEntryOwnerHasStripeAccount(email: string) {
  let entryOwnerCustomer = await findCustomer(email);

  if (!entryOwnerCustomer) {
    let newCustomer;
    let keyPairNewAcct;
    try {
      keyPairNewAcct = await createAndFundAccount();
    } catch (e) {
      console.log(e);
      throw 'could not create and fund stellar account';
    }
    try {
      let [, newCus] = [
        await allowTrust(keyPairNewAcct.secret),
        await createCustomerWithEmail(
          email,
          keyPairNewAcct.publicAddress,
          keyPairNewAcct.secret
        ),
      ];
      newCustomer = newCus;
    } catch (e) {
      console.log(e);
      throw 'could not create stripe customer';
    }
    return {
      publicAddress: newCustomer.metadata.publicAddress as string,
      seed: newCustomer.metadata.seed as string,
    };
  }

  let { metadata } = entryOwnerCustomer;
  let { publicAddress, seed } = metadata;
  return { publicAddress, seed };
}
