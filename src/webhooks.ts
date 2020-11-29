import express from 'express';
import {
  chargeCustomer,
  stripe,
  updateCustomer,
  updateCustomerWithAllowedTrust,
  startSubscription,
  cleanPendingChargeMetadata,
  cleanSubscriptionMetadata,
} from './payments/stripe';
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

  // Returns ok response if customer already has an stellar account
  if (metadata.publicAddress) {
    return response.send(200);
  }

  // Create account and allow trust should be executed independently, once the account is created it has to trust the asset
  try {
    console.log('create and fund account');
    keyPair = await createAndFundAccount();
    console.log('created and funded stellar account');
  } catch (e) {
    throw e;
  }

  try {
    console.log('updating customer');

    let updatedCustomer = await updateCustomer({
      customerId: id,
      publicAddress: keyPair.publicAddress,
      seed: keyPair.secret,
      allowedTrust: false,
    });
    console.log('customer', updatedCustomer);
    return response.send(200);
  } catch (e) {
    console.error('error updating customer and sending tokens', e);
    throw e;
  }
}

async function onCustomerUpdated({ object }: any, response) {
  const { email } = object;
  console.log('on customer updated', email);
  const { metadata, id } = await findCustomer(email);
  const {
    publicAddress,
    pendingCharge,
    subscribe,
    allowedTrust,
    seed,
  } = metadata;

  if (allowedTrust === 'false') {
    console.log('allowing trust', publicAddress);

    await allowTrust(seed);
    await updateCustomerWithAllowedTrust(id);
    return response.send(200);
  }

  if (allowedTrust === 'true') {
    // charge user with one time amount
    if (pendingCharge) {
      await chargeCustomer(id, parseInt(pendingCharge));
      return response.send(200);
    }

    // subscribe user to plan
    if (subscribe) {
      await startSubscription(id);
      return response.send(200);
    }
  }

  return response.send(200);
}

async function onChargeSucceeded({ object }: any, response) {
  const { receipt_email, amount } = object;
  const { metadata, id } = await findCustomer(receipt_email);
  const { publicAddress, pendingCharge, subscribe } = metadata;

  const sourceKeys = StellarSdkLibrary.Keypair.fromSecret(Config.ISSUER_SEED);

  console.log('sending subscription tokens from seed:', sourceKeys.publicKey());
  console.log('sending subscription tokens to:', publicAddress);
  console.log('amount: ', amount);
  let stripeFees = amount * 0.03;
  let amountWithDiscountedTransactionFees = amount - stripeFees;
  let amountInDollars = amountWithDiscountedTransactionFees / 100;
  let totalAmount = amountInDollars.toFixed(6).toString();
  console.log('amount in dollars: ', totalAmount);

  await sendSubscriptionTokens(publicAddress, totalAmount);
  if (pendingCharge) {
    await cleanPendingChargeMetadata(id);
    return response.send(200);
  }

  if (subscribe) {
    await cleanSubscriptionMetadata(id);
    return response.send(200);
  }

  return response.send(200);
}
