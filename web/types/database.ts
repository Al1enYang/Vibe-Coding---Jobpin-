/**
 * Supabase database type definitions
 * Matches the schema in data-model.md
 */

export interface UserProfile {
  id: string; // clerk_user_id
  email: string;
  role_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  country?: string | null;
  city?: string | null;
  work_types?: string[] | null;
  onboarding_completed: boolean;
  has_seen_dashboard_guide?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeParsingResult {
  id: string; // clerk_user_id
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  skills?: string[] | null;
  experiences?: Experience[] | null;
  resume_summary?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  company?: string | null;
  title?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  summary?: string | null;
}

export interface Subscription {
  id: string; // clerk_user_id
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan: 'free' | 'pro';
  active: boolean;
  next_billing_date?: string | null;
  created_at: string;
  updated_at: string;
}
