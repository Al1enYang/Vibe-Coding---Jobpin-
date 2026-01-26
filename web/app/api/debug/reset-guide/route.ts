import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Debug API: Reset dashboard guide status
 * Only works in development mode
 * Allows testing the guide functionality multiple times
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 500 }
    );
  }

  try {
    // Reset has_seen_dashboard_guide to false
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({ has_seen_dashboard_guide: false })
      .eq('clerk_user_id', userId);

    if (error) {
      console.error('[Reset Guide] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to reset guide status' },
        { status: 500 }
      );
    }

    console.log('[Reset Guide] Guide status reset for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Guide status reset successfully. Please clear localStorage and refresh.',
      instructions: [
        '1. Run: localStorage.removeItem("has_seen_dashboard_tour")',
        '2. Refresh the page',
        '3. Guide should appear',
      ],
    });
  } catch (error) {
    console.error('[Reset Guide] Error:', error);
    return NextResponse.json(
      { error: 'Failed to reset guide status' },
      { status: 500 }
    );
  }
}
