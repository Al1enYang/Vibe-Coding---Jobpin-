import { supabaseAdmin } from './supabase';
import type { UserProfile } from '@/types/database';

/**
 * Check if user has completed onboarding
 * Uses supabaseAdmin to bypass RLS in middleware context
 * @param userId - Clerk user ID
 * @returns true if onboarding is completed, false otherwise
 */
export async function isOnboardingComplete(
  userId: string
): Promise<boolean> {
  try {
    // Use supabaseAdmin to bypass RLS (middleware context doesn't have Supabase auth)
    if (!supabaseAdmin) {
      console.error('[isOnboardingComplete] SUPABASE_SERVICE_ROLE_KEY not set');
      return false;
    }

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      // If profile doesn't exist yet, treat as incomplete
      if (error.code === 'PGRST116') {
        return false;
      }
      console.error('Error checking onboarding status:', error);
      return false;
    }

    return data?.onboarding_completed ?? false;
  } catch (e) {
    console.error('Unexpected error checking onboarding status:', e);
    return false;
  }
}
