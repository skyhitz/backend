import express from 'express';
import {
  chargeCustomer,
  stripe,
  startSubscription,
  cleanPendingChargeMetadata,
  cleanSubscriptionMetadata,
  findCustomerById,
} from './payments/stripe';
import {
  // sendSubscriptionTokens,
  getXlmInUsdDexPrice,
} from './stellar/operations';
import { findCustomer } from './payments/stripe';
import { Config } from './config/index';
// import { getAll, smembers } from './redis';

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

      if (event.type === 'charge.succeeded') {
        return onChargeSucceeded(event.data, response);
      }

      if (
        event.type === 'customer.updated' ||
        event.type === 'customer.created'
      ) {
        return onCustomerUpdated(event.data, response);
      }
    }
  );
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
  const { metadata, id, email }: any = await findCustomerById(customer);
  const { pendingCharge, subscribe } = metadata;
  const transactionalFees = 106;
  let amountWithDiscountedTransactionFees = amount * (100 / transactionalFees);
  let amountInDollars = amountWithDiscountedTransactionFees / 100;

  let { price } = await getXlmInUsdDexPrice();
  let floatPrice = parseFloat(price);
  let finalAmount = amountInDollars / floatPrice;
  console.log(email);
  console.log(finalAmount);

  // const userId = await smembers('emails:' + email);
  // const { publicKey } = await getAll('users:' + userId);

  // toFixed leaves four decimals
  // await sendSubscriptionTokens(publicKey, finalAmount.toFixed(4));
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
