'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { auth, currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface SaveRoleNameState {
  error?: string;
  success?: boolean;
}

/**
 * Server action to save role_name to user_profiles table
 * Performs upsert: creates new profile if not exists, updates if exists
 * Uses supabaseAdmin (service_role key) to bypass RLS policies since we use Clerk for auth
 *
 * Supports edit mode via redirect_destination form data:
 * - If 'dashboard', redirects to /dashboard after save
 * - Otherwise, redirects to next onboarding step (/onboarding/profile)
 */
export async function saveRoleName(
  prevState: SaveRoleNameState,
  formData: FormData
): Promise<SaveRoleNameState> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  const roleName = formData.get('role_name') as string;

  if (!roleName || roleName.trim().length === 0) {
    return { error: 'Role name is required' };
  }

  // Get redirect destination
  const redirectDestination = formData.get('redirect_destination') as string;
  const shouldRedirectToDashboard = redirectDestination === 'dashboard';

  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    return { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' };
  }

  // Get user email from Clerk using currentUser()
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || '';

  console.log('[saveRoleName] Debug info:', {
    userId,
    email,
    roleName: roleName.trim(),
    redirectDestination: shouldRedirectToDashboard ? 'dashboard' : 'profile',
    timestamp: new Date().toISOString(),
  });

  const { data, error, status, statusText } = await supabaseAdmin
    .from('user_profiles')
    .upsert(
      {
        clerk_user_id: userId,
        email: email,
        role_name: roleName.trim(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'clerk_user_id',
        ignoreDuplicates: false,
      }
    )
    .select();

  if (error) {
    console.error('[saveRoleName] Supabase error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status,
      statusText,
    });
    return { error: `Failed to save: ${error.message} (${error.code})` };
  }

  console.log('[saveRoleName] Success:', data);

  revalidatePath('/onboarding/rolename');
  revalidatePath('/dashboard');

  // redirect() throws a NEXT_REDIRECT error to stop execution - this is expected
  if (shouldRedirectToDashboard) {
    redirect('/dashboard');
  } else {
    redirect('/onboarding/profile');
  }
}

/**
 * Role name data interface for pre-filling the form
 */
export interface RoleNameData {
  role_name?: string | null;
}

/**
 * Server action to fetch existing role name for pre-filling the form
 * Returns null if user is not authenticated or profile doesn't exist
 */
export async function getRoleName(): Promise<RoleNameData | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Use supabaseAdmin to fetch profile
  if (!supabaseAdmin) {
    console.error('[getRoleName] SUPABASE_SERVICE_ROLE_KEY not set');
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('user_profiles')
    .select('role_name')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[getRoleName] Supabase error:', {
      message: error.message,
      code: error.code,
    });
    return null;
  }

  return data;
}
