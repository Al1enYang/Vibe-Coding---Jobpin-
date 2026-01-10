import { supabase } from './supabase';
import type { UserProfile } from '@/types/database';

/**
 * Check if user has completed onboarding
 * @param userId - Clerk user ID
 * @returns true if onboarding is completed, false otherwise
 */
export async function isOnboardingComplete(
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('id', userId)
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
