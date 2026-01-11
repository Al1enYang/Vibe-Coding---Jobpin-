import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createPortalSession } from '@/lib/stripe-checkout';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('[Stripe Portal] SUPABASE_SERVICE_ROLE_KEY not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Fetch user's subscription to get Stripe customer ID
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('clerk_user_id', userId)
      .single();

    const customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Create portal session
    const portalUrl = await createPortalSession(customerId);

    return NextResponse.json({ url: portalUrl });
  } catch (error) {
    console.error('[Stripe Portal] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
