import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Stripe Webhook Handler
 * Handles subscription lifecycle events:
 * - checkout.session.completed: Create subscription record
 * - customer.subscription.updated: Update subscription status
 * - customer.subscription.deleted: Cancel subscription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] Missing signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Log received event (without sensitive data)
    console.log('[Stripe Webhook] Received event:', {
      id: event.id,
      type: event.type,
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(event);
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event);
        break;
      }
      default:
        console.log('[Stripe Webhook] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 * Creates or updates subscription record in database
 */
async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const clerkUserId = session.metadata?.clerk_user_id;

  if (!clerkUserId) {
    console.error('[Checkout Completed] Missing clerk_user_id in metadata');
    return;
  }

  if (!supabaseAdmin) {
    console.error('[Checkout Completed] SUPABASE_SERVICE_ROLE_KEY not set');
    return;
  }

  try {
    // Retrieve full subscription details from Stripe with expand options
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method'],
    });

    console.log('[Checkout Completed] Full subscription retrieved:', {
      id: subscription.id,
      status: subscription.status,
      has_current_period_end: 'current_period_end' in subscription,
      current_period_end: (subscription as any).current_period_end,
    });

    // Get current_period_end (Unix timestamp in seconds)
    const currentPeriodEnd = (subscription as any).current_period_end;

    if (!currentPeriodEnd || typeof currentPeriodEnd !== 'number') {
      console.error('[Checkout Completed] Invalid current_period_end:', currentPeriodEnd);
      return;
    }

    // Convert to milliseconds and then to ISO string
    const nextBillingDate = new Date(currentPeriodEnd * 1000).toISOString();
    console.log('[Checkout Completed] Converted next_billing_date:', nextBillingDate);

    // Insert or update subscription record
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(
        {
          clerk_user_id: clerkUserId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan: 'pro',
          active: true,
          next_billing_date: nextBillingDate,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_user_id',
        }
      );

    if (error) {
      console.error('[Checkout Completed] Database error:', error);
      return;
    }

    // Update user_profiles with stripe_customer_id
    await supabaseAdmin
      .from('user_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('clerk_user_id', clerkUserId);

    console.log('[Checkout Completed] Subscription created for user:', clerkUserId);
  } catch (error) {
    console.error('[Checkout Completed] Error:', error);
  }
}

/**
 * Handle customer.subscription.updated and customer.subscription.created events
 * Creates or updates subscription record in database
 */
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionId = subscription.id;
  const customerId = subscription.customer as string;

  if (!supabaseAdmin) {
    console.error('[Subscription Updated] SUPABASE_SERVICE_ROLE_KEY not set');
    return;
  }

  try {
    // IMPORTANT: Retrieve full subscription from Stripe to get current_period_end
    // The subscription object in the webhook event is lightweight and may not have all fields
    const fullSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method'],
    });

    console.log('[Subscription Updated] Full subscription retrieved:', {
      id: fullSubscription.id,
      status: fullSubscription.status,
      has_current_period_end: 'current_period_end' in fullSubscription,
      current_period_end: (fullSubscription as any).current_period_end,
    });

    // Determine plan and active status
    const plan = fullSubscription.status === 'active' || fullSubscription.status === 'trialing' ? 'pro' : 'free';
    const active = fullSubscription.status === 'active' || fullSubscription.status === 'trialing';

    // Get next billing date from fullSubscription.current_period_end
    let nextBillingDate: string | null = null;
    const currentPeriodEnd = (fullSubscription as any).current_period_end;

    if (currentPeriodEnd && typeof currentPeriodEnd === 'number') {
      nextBillingDate = new Date(currentPeriodEnd * 1000).toISOString();
      console.log('[Subscription Updated] Converted next_billing_date:', nextBillingDate);
    } else {
      console.warn('[Subscription Updated] No current_period_end available on full subscription object');
    }

    // Get customer to retrieve clerk_user_id from metadata
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || !customer.metadata?.clerk_user_id) {
      console.error('[Subscription Updated] Missing clerk_user_id in customer metadata');
      return;
    }
    const clerkUserId = customer.metadata.clerk_user_id;

    // Upsert subscription record (create if not exists, update if exists)
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(
        {
          clerk_user_id: clerkUserId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan,
          active,
          next_billing_date: nextBillingDate,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_user_id',
        }
      );

    if (error) {
      console.error('[Subscription Updated] Database error:', error);
      return;
    }

    console.log('[Subscription Updated] Subscription upserted:', { subscriptionId, clerkUserId, plan, active, nextBillingDate });
  } catch (error) {
    console.error('[Subscription Updated] Error:', error);
  }
}

/**
 * Handle customer.subscription.deleted event
 * Cancels subscription in database
 */
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const subscriptionId = subscription.id;
  const customerId = subscription.customer as string;

  if (!supabaseAdmin) {
    console.error('[Subscription Deleted] SUPABASE_SERVICE_ROLE_KEY not set');
    return;
  }

  try {
    // Get customer to retrieve clerk_user_id from metadata (for logging)
    const customer = await stripe.customers.retrieve(customerId);
    const clerkUserId = customer.deleted ? null : customer.metadata?.clerk_user_id;

    // Update subscription record to inactive (free plan)
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        plan: 'free',
        active: false,
        next_billing_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('[Subscription Deleted] Database error:', error);
      return;
    }

    console.log('[Subscription Deleted] Subscription cancelled:', { subscriptionId, clerkUserId });
  } catch (error) {
    console.error('[Subscription Deleted] Error:', error);
  }
}
