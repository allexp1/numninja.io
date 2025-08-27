import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

// Client-side Stripe promise
let stripePromise: Promise<any> | null = null;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Helper function to format price for Stripe (converts to cents)
export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

// Helper function to format price from Stripe (converts from cents)
export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100;
};

// Types for checkout session
export interface CheckoutSessionData {
  userId: string;
  email: string;
  items: Array<{
    id: string;
    number: string;
    countryCode: string;
    areaCode: string;
    monthlyPrice: number;
    setupPrice: number;
    quantity: number;
  }>;
  successUrl: string;
  cancelUrl: string;
}

// Create a Stripe checkout session
export async function createCheckoutSession(data: CheckoutSessionData) {
  const { userId, email, items, successUrl, cancelUrl } = data;

  // Calculate totals
  const setupTotal = items.reduce((sum, item) => sum + item.setupPrice, 0);
  const monthlyTotal = items.reduce((sum, item) => sum + item.monthlyPrice, 0);

  // Create line items for Stripe
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  // Add setup fees as one-time charges
  if (setupTotal > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Setup Fees',
          description: `One-time setup fee for ${items.length} number(s)`,
        },
        unit_amount: formatAmountForStripe(setupTotal),
      },
      quantity: 1,
    });
  }

  // Add monthly charges
  items.forEach((item) => {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Phone Number: ${item.number}`,
          description: `${item.countryCode} - ${item.areaCode}`,
          metadata: {
            numberId: item.id,
            number: item.number,
            countryCode: item.countryCode,
            areaCode: item.areaCode,
          },
        },
        unit_amount: formatAmountForStripe(item.monthlyPrice),
        recurring: {
          interval: 'month',
        },
      },
      quantity: 1,
    });
  });

  // Create the checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: monthlyTotal > 0 ? 'subscription' : 'payment',
    customer_email: email,
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      itemCount: items.length.toString(),
      items: JSON.stringify(items),
    },
    subscription_data: monthlyTotal > 0 ? {
      metadata: {
        userId,
      },
    } : undefined,
    payment_intent_data: monthlyTotal === 0 ? {
      metadata: {
        userId,
      },
    } : undefined,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    phone_number_collection: {
      enabled: true,
    },
  });

  return session;
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// Handle successful payment
export async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const { metadata, customer_email, id: sessionId } = session;
  
  if (!metadata?.userId || !metadata?.items) {
    throw new Error('Missing metadata in checkout session');
  }

  const items = JSON.parse(metadata.items);
  const userId = metadata.userId;

  // Return the data that will be used to create order records
  return {
    userId,
    email: customer_email,
    sessionId,
    items,
    amountTotal: session.amount_total ? formatAmountFromStripe(session.amount_total) : 0,
    currency: session.currency || 'usd',
    paymentStatus: session.payment_status,
    subscriptionId: session.subscription as string | null,
  };
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

// Get customer portal session
export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}

// Get payment method details
export async function getPaymentMethod(paymentMethodId: string) {
  return await stripe.paymentMethods.retrieve(paymentMethodId);
}

// List customer's payment methods
export async function listPaymentMethods(customerId: string) {
  return await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
}