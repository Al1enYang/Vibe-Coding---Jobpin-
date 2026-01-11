import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createCheckoutSession } from '@/lib/stripe-checkout';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('[Stripe Checkout] SUPABASE_SERVICE_ROLE_KEY not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Fetch user's profile to get existing Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('clerk_user_id', userId)
      .single();

    const customerId = profile?.stripe_customer_id || null;

    // Create checkout session
    const checkoutUrl = await createCheckoutSession(userId, customerId);

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
