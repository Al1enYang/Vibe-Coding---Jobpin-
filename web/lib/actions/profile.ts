'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface SaveProfileState {
  error?: string;
  success?: boolean;
}

/**
 * Server action to save profile fields (first_name, last_name, country, city)
 * Performs upsert: updates existing profile
 * Uses supabaseAdmin (service_role key) to bypass RLS policies since we use Clerk for auth
 *
 * Supports edit mode via redirect_destination form data:
 * - If 'dashboard', redirects to /dashboard after save
 * - Otherwise, redirects to next onboarding step (/onboarding/work-type)
 */
export async function saveProfile(
  prevState: SaveProfileState,
  formData: FormData
): Promise<SaveProfileState> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const country = formData.get('country') as string;
  const city = formData.get('city') as string;

  // Validate required fields
  if (!firstName || firstName.trim().length === 0) {
    return { error: 'First name is required' };
  }

  if (!lastName || lastName.trim().length === 0) {
    return { error: 'Last name is required' };
  }

  // Get redirect destination
  const redirectDestination = formData.get('redirect_destination') as string;
  const shouldRedirectToDashboard = redirectDestination === 'dashboard';

  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    return { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' };
  }

  console.log('[saveProfile] Debug info:', {
    userId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    country: country?.trim() || null,
    city: city?.trim() || null,
    redirectDestination: shouldRedirectToDashboard ? 'dashboard' : 'work-type',
    timestamp: new Date().toISOString(),
  });

  const { data, error, status, statusText } = await supabaseAdmin
    .from('user_profiles')
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      country: country?.trim() || null,
      city: city?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', userId)
    .select();

  if (error) {
    console.error('[saveProfile] Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status,
      statusText,
    });
    return { error: `Failed to save: ${error.message} (${error.code})` };
  }

  console.log('[saveProfile] Success:', data);

  revalidatePath('/onboarding/profile');
  revalidatePath('/dashboard');

  // redirect() throws a NEXT_REDIRECT error to stop execution - this is expected
  if (shouldRedirectToDashboard) {
    redirect('/dashboard');
  } else {
    redirect('/onboarding/work-type');
  }
}

/**
 * Profile data interface for pre-filling the form
 */
export interface ProfileData {
  first_name?: string | null;
  last_name?: string | null;
  country?: string | null;
  city?: string | null;
}

/**
 * Server action to fetch existing profile data for pre-filling the form
 * Returns null if user is not authenticated or profile doesn't exist
 */
export async function getProfile(): Promise<ProfileData | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Use supabaseAdmin to fetch profile
  if (!supabaseAdmin) {
    console.error('[getProfile] SUPABASE_SERVICE_ROLE_KEY not set');
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('first_name, last_name, country, city')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[getProfile] Supabase error:', {
      message: error.message,
      code: error.code,
    });
    return null;
  }

  return data;
}
