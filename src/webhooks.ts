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

export function stripeWebhook(graphQLServer) {
  graphQLServer.post(
    '/api/stripe-webhooks',
    bodyParser.raw({ type: 'application/json' }),
    (request: express.Request, response: express.Response) => {
      let sig = request.headers['stripe-signature'];

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
    keyPair = await createAndFundAccount();
  } catch (e) {
    throw e;
  }

  try {
    await updateCustomer({
      customerId: id,
      publicAddress: keyPair.publicAddress,
      seed: keyPair.secret,
      allowedTrust: false,
    });
    return response.send(200);
  } catch (e) {
    console.error('error updating customer and sending tokens', e);
    throw e;
  }
}

async function onCustomerUpdated(
  { object, previous_attributes }: any,
  response
) {
  // stripe updates the user currency on subscribe
  if (previous_attributes && previous_attributes.currency === null) {
    return response.send(200);
  }

  const { email } = object;
  const { metadata, id } = await findCustomer(email);
  const { pendingCharge, subscribe, allowedTrust, seed } = metadata;

  if (allowedTrust === 'false') {
    await allowTrust(seed);
    await updateCustomerWithAllowedTrust(id);
    return response.send(200);
  }

  if (allowedTrust === 'true') {
    // charge user with one time amount
    if (pendingCharge) {
      await chargeCustomer(id, parseFloat(pendingCharge));
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
  console.log('object', object);

  const { receipt_email, amount } = object;
  console.log('receipt', receipt_email);
  const customer = await findCustomer(receipt_email);
  console.log('customer', customer);
  const { metadata, id } = customer;
  const { publicAddress, pendingCharge, subscribe } = metadata;
  let amountWithDiscountedTransactionFees = amount * (100 / 103);
  let amountInDollars = amountWithDiscountedTransactionFees / 100;
  let totalAmount = amountInDollars.toFixed(6).toString();

  if (!publicAddress) {
    return response.send(200);
  }

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
