import express from 'express';
import { stripe, updateCustomer } from './payments/stripe';
import {
  sendSubscriptionTokens,
  createAndFundAccount,
  allowTrust,
} from './payments/stellar';
import { findCustomer } from './payments/stripe';
import { Config } from './config/index';
import bodyParser from 'body-parser';

function stripeWebhook(graphQLServer) {
  graphQLServer.post(
    '/api/stripe-webhooks',
    bodyParser.raw({ type: 'application/json' }),
    (request: express.Request, response: express.Response) => {
      let sig = request.headers['stripe-signature'];
      console.log('signature', sig);

      const event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        Config.STRIPE_WEBHOOK_SECRET
      );
      if (event) {
        response.send(200);
      }

      if (event.type === 'charge.succeeded') {
        return processChargeSucceeded(event.data);
      }
    }
  );
}

export function webhooks(graphQLServer) {
  stripeWebhook(graphQLServer);
}

async function allowTrustAndSendSubscriptionTokens(keyPair, amount) {
  console.log('sending subscription tokens', keyPair.publicAddress);
  console.log('amount: ', amount);
  let stripeFees = amount * 0.03;
  let amountWithDiscountedTransactionFees = amount - stripeFees;
  await allowTrust(keyPair.secret);
  return sendSubscriptionTokens(
    keyPair.publicAddress,
    amountWithDiscountedTransactionFees / 100
  );
}

async function processChargeSucceeded({ object }: any) {
  let keyPair: { secret: string; publicAddress: string };

  console.log('event object', object);
  const { receipt_email, amount } = object;
  const { id } = await findCustomer(receipt_email);

  try {
    keyPair = await createAndFundAccount();
    console.log('created and funded stellar account');
  } catch (e) {
    throw e;
  }

  try {
    let [customer, transaction] = await Promise.all([
      updateCustomer({
        customerId: id,
        publicAddress: keyPair.publicAddress,
        seed: keyPair.secret,
      }),
      allowTrustAndSendSubscriptionTokens(keyPair, amount),
    ]);
    console.log('customer', customer);
    console.log('transaction: ', transaction);
    return;
  } catch (e) {
    console.error('error updating customer and sending tokens', e);
    throw e;
  }
}

// async function processSubscriptionCreated(object: any, response: any) {
//   const { customer } = object;
//   const { metadata, subscriptions } = await findCustomer(customer);
//   const { publicAddress } = metadata;
//   const { data } = subscriptions;
//   const subscription = data.find(sub => sub.plan.id === Config.STRIPE_PLAN_ID);
//   const { plan } = subscription;
//   if (subscription.status === 'trialing') {
//     const freeTrialTokens = plan.amount / (plan.amount / 100);
//     await sendSubscriptionTokens(publicAddress, freeTrialTokens);
//   }
//   response.send(200);
// }
