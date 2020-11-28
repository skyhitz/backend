import { CustomerPayload, BuyCreditsPayload } from './types';
import {
  cancelSubscription,
  createOrFindCustomer,
  findCustomer,
  createCustomerWithEmail,
} from './stripe';
import { createAndFundAccount, mergeAccount, allowTrust } from './stellar';

export async function buyCreditsWithCard(payload: BuyCreditsPayload) {
  let newCustomer;
  try {
    newCustomer = await createOrFindCustomer({
      email: payload.email,
      cardToken: payload.cardToken,
      pendingCharge: payload.amount.toString(),
    });
    console.log('created customer');
  } catch (e) {
    throw e;
  }
}

export async function subscribe(customerPayload: CustomerPayload) {
  let newCustomer;
  try {
    newCustomer = await createOrFindCustomer({
      ...customerPayload,
      subscribe: 'true',
    });
    console.log('created customer');
  } catch (e) {
    throw e;
  }
}

export async function cancel(email: string) {
  let { seed } = await cancelSubscription(email);
  await mergeAccount(seed);
}

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
    return newCustomer.metadata.publicAddress;
  }

  let { metadata } = entryOwnerCustomer;
  let { publicAddress } = metadata;
  return publicAddress;
}
