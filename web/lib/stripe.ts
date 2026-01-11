import Stripe from 'stripe';

/**
 * Stripe client singleton
 * Initializes Stripe with the secret key from environment variables
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

/**
 * Get the Price ID from environment variables
 * Throws an error if not configured
 */
export function getPriceId(): string {
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;

  if (!priceId) {
    throw new Error('NEXT_PUBLIC_STRIPE_PRICE_ID is not configured');
  }

  return priceId;
}

/**
 * Get the app URL from environment variables
 * Defaults to http://localhost:3000 if not configured
 */
export function getAppUrl(): string {
  return process.env.APP_URL || 'http://localhost:3000';
}
