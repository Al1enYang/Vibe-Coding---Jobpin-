import { stripe, getPriceId, getAppUrl } from './stripe';

/**
 * Create a Stripe Checkout session for a user
 * @param userId - Clerk user ID
 * @param customerId - Optional existing Stripe customer ID
 * @returns Checkout session URL
 */
export async function createCheckoutSession(
  userId: string,
  customerId?: string | null
): Promise<string> {
  // Get or create customer
  let stripeCustomerId = customerId;

  if (!stripeCustomerId) {
    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      metadata: {
        clerk_user_id: userId,
      },
    });
    stripeCustomerId = customer.id;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: getPriceId(),
        quantity: 1,
      },
    ],
    success_url: `${getAppUrl()}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/dashboard`,
    metadata: {
      clerk_user_id: userId,
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return session.url;
}

/**
 * Create a Stripe Customer Portal session
 * @param customerId - Stripe customer ID
 * @returns Portal session URL
 */
export async function createPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/dashboard?portal_return=true`,
  });

  if (!session.url) {
    throw new Error('Failed to create portal session URL');
  }

  return session.url;
}
