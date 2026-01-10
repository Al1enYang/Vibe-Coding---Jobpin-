'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface CompleteOnboardingState {
  error?: string;
  success?: boolean;
}

/**
 * Server action to mark onboarding as completed
 * Sets onboarding_completed = true in user_profiles table
 * Then redirects to /dashboard
 */
export async function completeOnboarding(
  prevState: CompleteOnboardingState,
  formData: FormData
): Promise<CompleteOnboardingState> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    return { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' };
  }

  console.log('[completeOnboarding] Completing onboarding for user:', userId);

  const { data, error, status, statusText } = await supabaseAdmin
    .from('user_profiles')
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', userId)
    .select();

  if (error) {
    console.error('[completeOnboarding] Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status,
      statusText,
    });
    return { error: `Failed to complete onboarding: ${error.message} (${error.code})` };
  }

  console.log('[completeOnboarding] Success:', data);

  revalidatePath('/onboarding');
  revalidatePath('/dashboard');

  // redirect() throws a NEXT_REDIRECT error to stop execution - this is expected
  redirect('/dashboard');
}
