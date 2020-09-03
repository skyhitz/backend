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

export function stripeWebhook(graphQLServer) {
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

      if (event.type === 'customer.created') {
        return onCustomerCreated(event.data, response);
      }

      if (event.type === 'charge.succeeded') {
        return onChargeSucceeded(event.data, response);
      }
    }
  );
}

async function onCustomerCreated({ object }: any, response) {
  let keyPair: { secret: string; publicAddress: string };
  const { id } = object;

  try {
    console.log('create and fund account');
    keyPair = await createAndFundAccount();
    console.log('created and funded stellar account');
  } catch (e) {
    throw e;
  }

  try {
    console.log('updating customer and allowing trust');

    let updatedCustomer = await updateCustomer({
      customerId: id,
      publicAddress: keyPair.publicAddress,
      seed: keyPair.secret,
    });
    console.log('customer', updatedCustomer);
    return response.send(200);
  } catch (e) {
    console.error('error updating customer and sending tokens', e);
    throw e;
  }
}

async function onChargeSucceeded({ object }: any, response) {
  const { receipt_email, amount } = object;
  const { metadata } = await findCustomer(receipt_email);
  const { publicAddress, secret } = metadata;

  console.log('sending subscription tokens', publicAddress);
  console.log('amount: ', amount);
  let stripeFees = amount * 0.03;
  let amountWithDiscountedTransactionFees = amount - stripeFees;
  let amountInDollars = amountWithDiscountedTransactionFees / 100;
  console.log('amount in dollars: ', amountInDollars);
  await allowTrust(secret);
  sendSubscriptionTokens(publicAddress, amountInDollars);
  return response.send(200);
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
