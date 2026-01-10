'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface SaveWorkTypeState {
  error?: string;
  success?: boolean;
}

/**
 * Server action to save work_types array to user_profiles table
 * Performs upsert: updates existing profile with work types array
 * Uses supabaseAdmin (service_role key) to bypass RLS policies since we use Clerk for auth
 */
export async function saveWorkType(
  prevState: SaveWorkTypeState,
  formData: FormData
): Promise<SaveWorkTypeState> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  // Get all work_types values from FormData (multiple values with same key)
  const workTypesEntries = formData.getAll('work_types') as string[];

  // Validate work types - only allow specific values
  const validWorkTypes = ['part-time', 'full-time', 'internship'];
  const filteredWorkTypes = workTypesEntries.filter((type) =>
    validWorkTypes.includes(type)
  );

  // Get redirect destination
  const redirectDestination = formData.get('redirect_destination') as string;
  const shouldRedirectToDashboard = redirectDestination === 'dashboard';

  console.log('[saveWorkType] Debug info:', {
    userId,
    workTypes: filteredWorkTypes,
    redirectDestination: shouldRedirectToDashboard ? 'dashboard' : 'resume',
    timestamp: new Date().toISOString(),
  });

  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    return { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' };
  }

  const { data, error, status, statusText } = await supabaseAdmin
    .from('user_profiles')
    .update({
      work_types: filteredWorkTypes.length > 0 ? filteredWorkTypes : null,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', userId)
    .select();

  if (error) {
    console.error('[saveWorkType] Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status,
      statusText,
    });
    return { error: `Failed to save: ${error.message} (${error.code})` };
  }

  console.log('[saveWorkType] Success:', data);

  revalidatePath('/onboarding/work-type');
  revalidatePath('/dashboard');

  // redirect() throws a NEXT_REDIRECT error to stop execution - this is expected
  if (shouldRedirectToDashboard) {
    redirect('/dashboard');
  } else {
    redirect('/onboarding/resume');
  }
}

/**
 * Work type data interface for pre-filling the form
 */
export interface WorkTypeData {
  work_types?: (string | null)[] | null;
}

/**
 * Server action to fetch existing work type data for pre-filling the form
 * Returns null if user is not authenticated or profile doesn't exist
 */
export async function getWorkType(): Promise<WorkTypeData | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Use supabaseAdmin to fetch profile
  if (!supabaseAdmin) {
    console.error('[getWorkType] SUPABASE_SERVICE_ROLE_KEY not set');
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('work_types')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[getWorkType] Supabase error:', {
      message: error.message,
      code: error.code,
    });
    return null;
  }

  return data;
}
