import Stripe from 'stripe';
import { CustomerPayload } from './types';
import { Config } from '../config';
export const stripe = new Stripe(Config.STRIPE_SECRET_KEY, {
  apiVersion: null,
  maxNetworkRetries: 0,
  httpAgent: null,
  timeout: 80000,
  host: 'api.stripe.com',
  port: 443,
  protocol: 'https',
  telemetry: true,
});

export async function updateCustomerWithPendingCharge(
  customerId: string,
  pendingCharge: string
) {
  return stripe.customers.update(customerId, {
    metadata: {
      pendingCharge: pendingCharge,
    },
  });
}

export async function updateCustomerWithSubscription(
  customerId: string,
  subscribe: string
) {
  return stripe.customers.update(customerId, {
    metadata: {
      subscribe: subscribe,
    },
  });
}

export async function cleanSubscriptionMetadata(customerId) {
  return stripe.customers.update(customerId, {
    metadata: {
      subscribe: null,
    },
  });
}

export async function cleanPendingChargeMetadata(customerId) {
  return stripe.customers.update(customerId, {
    metadata: {
      pendingCharge: null,
    },
  });
}

export async function updateSource(customerId: string, source: string) {
  return stripe.customers.update(customerId, {
    source: source,
  });
}

export async function createCustomer({
  email,
  cardToken,
  pendingCharge,
  subscribe,
}: CustomerPayload) {
  let customer = await findCustomer(email);
  if (customer && customer.id) {
    throw 'customer already exists';
  }

  if (pendingCharge) {
    return stripe.customers.create({
      email: email,
      source: cardToken,
      metadata: {
        pendingCharge: pendingCharge,
      },
    });
  }

  if (subscribe) {
    return stripe.customers.create({
      email: email,
      source: cardToken,
      metadata: {
        subscribe: subscribe,
      },
    });
  }

  return stripe.customers.create({
    email: email,
    source: cardToken,
  });
}

export async function createCustomerWithEmail(
  email: string,
  publicAddress: string,
  seed: string
) {
  let customer = await findCustomer(email);
  if (customer && customer.id) {
    throw 'customer already exists';
  }
  return stripe.customers.create({
    email: email,
    metadata: {
      publicAddress: publicAddress,
      seed: seed,
    },
  });
}

export async function findCustomerById(id: string) {
  return await stripe.customers.retrieve(id);
}

export async function findCustomer(email: string) {
  let match = await stripe.customers.list({
    limit: 1,
    email: email,
  });

  return match.data ? match.data[0] : null;
}

export async function findSubscription(customerId: string) {
  let match = await stripe.subscriptions.list({
    limit: 1,
    customer: customerId,
    plan: Config.STRIPE_PLAN_ID,
  });

  return match.data[0];
}

export async function createOrFindCustomer({
  email,
  cardToken,
  pendingCharge,
  subscribe,
}: CustomerPayload) {
  let customer;
  try {
    customer = await createCustomer({
      email,
      cardToken,
      pendingCharge,
      subscribe,
    });
    return customer;
  } catch (e) {
    // check if the customer has cardToken, add cardToken
    let sourceCustomer = await findCustomer(email);
    if (!!sourceCustomer.id && !sourceCustomer.default_source) {
      await updateSource(sourceCustomer.id, cardToken);
    }
    if (pendingCharge) {
      return await updateCustomerWithPendingCharge(
        sourceCustomer.id,
        pendingCharge
      );
    }
    if (subscribe) {
      return await updateCustomerWithSubscription(sourceCustomer.id, subscribe);
    }
    return sourceCustomer;
  }
}

export async function startSubscription(customerId: string) {
  await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        plan: Config.STRIPE_PLAN_ID,
      },
    ],
  });
  return customerId;
}

export async function chargeCustomer(customerId: string, amount: number) {
  await stripe.charges.create({
    amount: Math.floor(amount * 100),
    currency: 'usd',
    customer: customerId,
  });
}

export async function cancelSubscription(email: string) {
  let { id, metadata } = await findCustomer(email);
  await stripe.customers.del(id);
  return metadata;
}
