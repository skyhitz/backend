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
import StellarSdkLibrary = require('stellar-sdk');


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

      if (event.type === 'customer.updated') {
        return onCustomerUpdated(event.data, response);
      }
    }
  );
}

async function onCustomerCreated({ object }: any, response) {
  let keyPair: { secret: string; publicAddress: string };
  const { id, metadata } = object;

  if (metadata.publicAddress) {
    return response.send(200);
  }

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
      allowedTrust: false,
      amount: '0',
    });
    console.log('customer', updatedCustomer);
    return response.send(200);
  } catch (e) {
    console.error('error updating customer and sending tokens', e);
    throw e;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function onChargeSucceeded({ object }: any, response) {
  const { receipt_email, amount } = object;
  await sleep(1000);
  const { metadata, id } = await findCustomer(receipt_email);
  const { publicAddress, seed } = metadata;
  const sourceKeys = StellarSdkLibrary.Keypair.fromSecret(Config.ISSUER_SEED);

  console.log('sending subscription tokens from seed:', sourceKeys.publicKey);
  console.log('sending subscription tokens to:', publicAddress);
  console.log('amount: ', amount);
  let stripeFees = amount * 0.03;
  let amountWithDiscountedTransactionFees = amount - stripeFees;
  let amountInDollars = amountWithDiscountedTransactionFees / 100;
  let totalAmount = amountInDollars.toFixed(6).toString();
  console.log('amount in dollars: ', totalAmount);
  await allowTrust(seed);

  await updateCustomer({
    customerId: id,
    publicAddress: publicAddress,
    seed: seed,
    allowedTrust: true,
    amount: totalAmount,
  });

  return response.send(200);
}

async function onCustomerUpdated({ object }: any, response) {
  const { email } = object;
  const { metadata, id } = await findCustomer(email);
  const { publicAddress, amount, allowedTrust, seed } = metadata;
  if (amount === '0') {
    return response.send(200);
  }
  if (allowedTrust === 'true') {
    await sendSubscriptionTokens(publicAddress, amount);
    await updateCustomer({
      customerId: id,
      publicAddress: publicAddress,
      seed: seed,
      allowedTrust: true,
      amount: '0',
    });
  }
  return response.send(200);
}

// async function processSubscriptionCreated(object: any, response: any) {
//   const { receipt_email } = object;
//   const { metadata, subscriptions } = await findCustomer(receipt_email);
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
