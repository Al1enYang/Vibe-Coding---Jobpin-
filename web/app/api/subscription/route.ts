import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Get current user's subscription status
 * Used for polling to check for updates after returning from Stripe Portal
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Fetch subscription
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    return NextResponse.json({
      plan: subscription?.plan || 'free',
      active: subscription?.active || false,
      next_billing_date: subscription?.next_billing_date || null,
    });
  } catch (error) {
    console.error('[Subscription API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
