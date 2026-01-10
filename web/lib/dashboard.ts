import { supabase } from './supabase';
import type { UserProfile, ResumeParsingResult, Subscription } from '@/types/database';

/**
 * Calculate profile completion percentage
 * Based on spec.md requirements:
 * - Profile (RoleName + First Name + Last Name): 40%
 *   - RoleName: 15%
 *   - First Name: 15%
 *   - Last Name: 10%
 * - Resume: 40%
 * - Subscription: 20%
 */
export interface ProgressScore {
  total: number;
  roleName: number;
  firstName: number;
  lastName: number;
  resume: number;
  subscription: number;
}

export function calculateProgressScore(
  profile: UserProfile | null,
  resume: ResumeParsingResult | null,
  subscription: Subscription | null
): ProgressScore {
  const score: ProgressScore = {
    total: 0,
    roleName: 0,
    firstName: 0,
    lastName: 0,
    resume: 0,
    subscription: 0,
  };

  // Profile scores: 40% total
  if (profile?.role_name) {
    score.roleName = 15;
    score.total += 15;
  }
  if (profile?.first_name) {
    score.firstName = 15;
    score.total += 15;
  }
  if (profile?.last_name) {
    score.lastName = 10;
    score.total += 10;
  }

  // Resume: 40%
  // Resume is considered complete if it has at least some parsed data
  if (resume && (resume.full_name || resume.email || resume.phone || resume.resume_summary)) {
    score.resume = 40;
    score.total += 40;
  }

  // Subscription: 20%
  if (subscription?.active && subscription.plan === 'pro') {
    score.subscription = 20;
    score.total += 20;
  }

  return score;
}

/**
 * Get progress bar color based on completion percentage
 * 0-49%: red, 50-99%: yellow, 100%: green
 */
export function getProgressColor(percentage: number): string {
  if (percentage < 50) return 'bg-red-500';
  if (percentage < 100) return 'bg-yellow-500';
  return 'bg-green-500';
}

/**
 * Fetch all dashboard data for a user
 */
export async function fetchDashboardData(userId: string) {
  try {
    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    // Fetch resume
    const { data: resume, error: resumeError } = await supabase
      .from('resume_parsing_results')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (resumeError && resumeError.code !== 'PGRST116') {
      console.error('Error fetching resume:', resumeError);
    }

    // Fetch subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subscriptionError);
    }

    return {
      profile: profile || null,
      resume: resume || null,
      subscription: subscription || null,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      profile: null,
      resume: null,
      subscription: null,
    };
  }
}
