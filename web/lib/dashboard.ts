import { supabaseAdmin } from './supabase';
import type { UserProfile, ResumeParsingResult, Subscription } from '@/types/database';

/**
 * Calculate profile completion percentage
 * Based on spec.md requirements:
 * - Role Name: 15% (role_name non-empty)
 * - Profile: 40% (first_name, last_name, country, city all non-empty)
 * - Work Type: 10% (work_types array has length > 0, optional)
 * - Resume: 35% (experiences.length > 0 OR resume_summary non-empty)
 */
export interface ProgressScore {
  total: number;
  roleName: number;
  profile: number;
  workType: number;
  resume: number;
}

export function calculateProgressScore(
  profile: UserProfile | null,
  resume: ResumeParsingResult | null,
  subscription: Subscription | null
): ProgressScore {
  const score: ProgressScore = {
    total: 0,
    roleName: 0,
    profile: 0,
    workType: 0,
    resume: 0,
  };

  // Role Name: 15%
  if (profile?.role_name && profile.role_name.trim().length > 0) {
    score.roleName = 15;
    score.total += 15;
  }

  // Profile: 40% (first_name, last_name, country, city all non-empty)
  const hasFirstName = profile?.first_name && profile.first_name.trim().length > 0;
  const hasLastName = profile?.last_name && profile.last_name.trim().length > 0;
  const hasCountry = profile?.country && profile.country.trim().length > 0;
  const hasCity = profile?.city && profile.city.trim().length > 0;

  if (hasFirstName && hasLastName && hasCountry && hasCity) {
    score.profile = 40;
    score.total += 40;
  }

  // Work Type: 10% (optional - work_types array has length > 0)
  if (profile?.work_types && profile.work_types.length > 0) {
    score.workType = 10;
    score.total += 10;
  }

  // Resume: 35% (experiences.length > 0 OR resume_summary non-empty)
  if (resume) {
    const hasExperiences = resume.experiences && resume.experiences.length > 0;
    const hasSummary = resume.resume_summary && resume.resume_summary.trim().length > 0;

    if (hasExperiences || hasSummary) {
      score.resume = 35;
      score.total += 35;
    }
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
    // Use supabaseAdmin to bypass RLS (we use Clerk for auth)
    if (!supabaseAdmin) {
      console.error('[fetchDashboardData] SUPABASE_SERVICE_ROLE_KEY not set');
      return {
        profile: null,
        resume: null,
        subscription: null,
      };
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    // Fetch resume
    const { data: resume, error: resumeError } = await supabaseAdmin
      .from('resume_parsing_results')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (resumeError && resumeError.code !== 'PGRST116') {
      console.error('Error fetching resume:', resumeError);
    }

    // Fetch subscription
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
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
