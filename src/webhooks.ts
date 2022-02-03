import express from 'express';
import {
  chargeCustomer,
  stripe,
  updateCustomer,
  startSubscription,
  cleanPendingChargeMetadata,
  cleanSubscriptionMetadata,
  findCustomerById,
} from './payments/stripe';
import {
  sendSubscriptionTokens,
  createAndFundAccount,
  getXlmInUsdDexPrice,
} from './stellar/operations';
import { findCustomer } from './payments/stripe';
import { Config } from './config/index';

export function stripeWebhook(graphQLServer) {
  graphQLServer.post(
    '/api/stripe-webhooks',
    express.raw({ type: 'application/json' }),
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
  const { pendingCharge, subscribe } = metadata;

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

  return response.send(200);
}

async function onChargeSucceeded({ object }: any, response) {
  const { customer, amount } = object;
  const { metadata, id }: any = await findCustomerById(customer);
  const { publicAddress, pendingCharge, subscribe } = metadata;
  const transactionalFees = 106;
  let amountWithDiscountedTransactionFees = amount * (100 / transactionalFees);
  let amountInDollars = amountWithDiscountedTransactionFees / 100;

  if (!publicAddress) {
    return response.send(200);
  }

  let { price } = await getXlmInUsdDexPrice();
  let floatPrice = parseFloat(price);
  let finalAmount = amountInDollars / floatPrice;
  // toFixed leaves four decimals
  await sendSubscriptionTokens(publicAddress, finalAmount.toFixed(4));
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
