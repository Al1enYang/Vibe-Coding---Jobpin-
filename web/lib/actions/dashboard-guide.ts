'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export interface MarkGuideSeenState {
  error?: string;
  success?: boolean;
}

/**
 * Server action to mark dashboard guide as seen
 * Updates user_profiles.has_seen_dashboard_guide to true
 * Uses supabaseAdmin to bypass RLS since we use Clerk for auth
 */
export async function markDashboardGuideSeen(
  prevState: MarkGuideSeenState,
  formData: FormData
): Promise<MarkGuideSeenState> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    console.warn('[markDashboardGuideSeen] SUPABASE_SERVICE_ROLE_KEY not set');
    return { success: true }; // Don't block UI if DB update fails
  }

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({ has_seen_dashboard_guide: true })
    .eq('clerk_user_id', userId);

  if (error) {
    console.warn('[markDashboardGuideSeen] Failed to update guide status:', error);
    return { success: true }; // Don't block UI if DB update fails
  }

  revalidatePath('/dashboard');

  return { success: true };
}

/**
 * Check if user has seen the dashboard guide
 * Returns true if user has seen the guide, false otherwise
 */
export async function hasSeenDashboardGuide(): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  // Use supabaseAdmin to fetch profile
  if (!supabaseAdmin) {
    console.warn('[hasSeenDashboardGuide] SUPABASE_SERVICE_ROLE_KEY not set');
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('has_seen_dashboard_guide')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[hasSeenDashboardGuide] Failed to fetch guide status:', error);
    return false;
  }

  return data?.has_seen_dashboard_guide ?? false;
}
