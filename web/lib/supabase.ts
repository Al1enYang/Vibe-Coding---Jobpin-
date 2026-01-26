import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Debug: Log environment configuration
console.log('[Supabase Config] Initializing with:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  nodeEnv: process.env.NODE_ENV,
});

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Client for client-side operations (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for server-side operations (bypasses RLS)
// WARNING: Only use this in server-side code after proper authentication (e.g., Clerk)
export const supabaseAdmin = (() => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    // Log warning but don't throw - service operations will fail gracefully
    console.warn('SUPABASE_SERVICE_ROLE_KEY not set. Server operations may fail due to RLS policies.');
    return null;
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
})();
