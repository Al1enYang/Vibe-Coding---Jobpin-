import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Reset Subscription - For testing purposes only
 * Deletes the current user's subscription record from the database
 * This allows testing the subscription flow multiple times
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      console.error('[Reset Subscription] SUPABASE_SERVICE_ROLE_KEY not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Delete subscription record
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('[Reset Subscription] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to reset subscription' },
        { status: 500 }
      );
    }

    console.log('[Reset Subscription] Subscription reset for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Subscription reset successfully',
    });
  } catch (error) {
    console.error('[Reset Subscription] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reset subscription' },
      { status: 500 }
    );
  }
}
