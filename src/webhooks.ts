import { Express } from 'express';
import { stripe } from './payments/stripe';
import { sendSubscriptionTokens } from './payments/stellar';
import { findCustomer } from './payments/stripe';
import { Config } from './config/index';

function stripeWebhook(graphQLServer: Express) {
  graphQLServer.post('/stripe-webhooks', (request: any, response) => {
    let sig = request.headers['stripe-signature'];

    const event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      Config.STRIPE_WEBHOOK_SECRET
    );
    if (event) {
      response.send(200);
    }

    if (event.type === 'charge.succeeded') {
      return processChargeSucceeded(event.data);
    }
  });
}

export function webhooks(graphQLServer: Express) {
  stripeWebhook(graphQLServer);
}

async function processChargeSucceeded({ object }: any) {
  console.log('event object', object);
  const { receipt_email, amount } = object;
  const { metadata } = await findCustomer(receipt_email);
  const { publicAddress } = metadata;
  if (!publicAddress) {
    return;
  }
  try {
    console.log('sending subscription tokens', publicAddress);
    console.log('amount: ', amount);
    let stripeFees = amount * 0.03;
    let amountWithDiscountedTransactionFees = amount - stripeFees;
    // $7 plan gives the user 7 credits, amount is in cents
    let transaction = await sendSubscriptionTokens(
      publicAddress,
      amountWithDiscountedTransactionFees / 100
    );
    console.log('transaction: ', transaction);
    return;
  } catch (e) {
    console.error('error sending subscription tokens', e);
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
