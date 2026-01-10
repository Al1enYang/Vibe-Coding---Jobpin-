import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Experience } from '@/types/database';
import { fetchDashboardData } from '@/lib/dashboard';
import { WelcomeHeader } from '@/components/dashboard/welcome-header';
import { ProfileProgress } from '@/components/dashboard/profile-progress';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch dashboard data
  const { profile, resume, subscription } = await fetchDashboardData(userId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        {/* Welcome Header */}
        <WelcomeHeader />

        {/* Profile Progress */}
        <ProfileProgress profile={profile} resume={resume} subscription={subscription} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Onboarding Modules */}
          <div className="lg:col-span-2 space-y-6">
            {/* Onboarding Modules Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-foreground">Onboarding Progress</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Role Name Module */}
                <a
                  href="/onboarding/rolename?edit=1"
                  className="group p-5 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profile?.role_name ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                        {profile?.role_name ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">1</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Role Name</h3>
                        <p className="text-sm text-muted-foreground">
                          {profile?.role_name ? 'Completed' : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    Edit →
                  </p>
                </a>

                {/* Profile Module */}
                <a
                  href="/onboarding/profile?edit=1"
                  className="group p-5 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profile?.first_name && profile?.last_name && profile?.country && profile?.city ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                        {profile?.first_name && profile?.last_name && profile?.country && profile?.city ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">2</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Profile</h3>
                        <p className="text-sm text-muted-foreground">
                          {profile?.first_name && profile?.last_name && profile?.country && profile?.city
                            ? 'Completed'
                            : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    Edit →
                  </p>
                </a>

                {/* Work Type Module */}
                <a
                  href="/onboarding/work-type?edit=1"
                  className="group p-5 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profile?.work_types && profile.work_types.length > 0 ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                        {profile?.work_types && profile.work_types.length > 0 ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">3</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Work Type</h3>
                        <p className="text-sm text-muted-foreground">
                          {profile?.work_types && profile.work_types.length > 0
                            ? 'Completed'
                            : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    Edit →
                  </p>
                </a>

                {/* Resume Module */}
                <a
                  href="/onboarding/resume?edit=1"
                  className="group p-5 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${resume && (resume.experiences?.length > 0 || resume.resume_summary?.trim().length > 0) ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>
                        {resume && (resume.experiences?.length > 0 || resume.resume_summary?.trim().length > 0) ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm font-medium">4</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Resume</h3>
                        <p className="text-sm text-muted-foreground">
                          {resume && (resume.experiences?.length > 0 || resume.resume_summary?.trim().length > 0) ? 'Completed' : 'Not uploaded'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    Edit →
                  </p>
                </a>
              </div>
            </section>

            {/* Resume Section */}
            <section className="p-6 bg-card border border-border rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Resume Summary</h2>
                <a
                  href="/onboarding/resume?edit=1"
                  className="text-sm text-primary hover:underline"
                >
                  Re-upload →
                </a>
              </div>

              {resume ? (
                <div className="space-y-4">
                  {/* Header Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                      <p className="text-sm font-medium text-foreground">{resume.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium text-foreground">{resume.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-medium text-foreground">{resume.phone || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  {resume.skills && resume.skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {resume.skills.map((skill: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {resume.resume_summary && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Summary</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{resume.resume_summary}</p>
                    </div>
                  )}

                  {/* Experiences */}
                  {resume.experiences && resume.experiences.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-3">Experience</p>
                      <div className="space-y-3">
                        {resume.experiences.map((exp: Experience, index: number) => (
                          <div key={index} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-sm font-medium text-foreground">{exp.title || 'Role'}</p>
                              <p className="text-xs text-muted-foreground">
                                {exp.start_date && exp.end_date
                                  ? `${exp.start_date} - ${exp.end_date}`
                                  : exp.start_date || 'Dates unknown'}
                              </p>
                            </div>
                            <p className="text-sm text-foreground">{exp.company || 'Company'}</p>
                            {exp.summary && (
                              <p className="text-sm text-muted-foreground mt-2">{exp.summary}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No resume uploaded yet</p>
                  <a
                    href="/onboarding/resume?edit=1"
                    className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Upload Resume
                  </a>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Subscription */}
          <div className="lg:col-span-1">
            {/* Subscription Section (Placeholder for now) */}
            <section className="p-6 bg-card border border-border rounded-xl">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Subscription</h2>

              {subscription?.active && subscription.plan === 'pro' ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm font-medium text-green-500">Pro Plan</p>
                    <p className="text-xs text-muted-foreground mt-1">$9/month</p>
                  </div>
                  {subscription.next_billing_date && (
                    <p className="text-sm text-muted-foreground">
                      Next billing: {new Date(subscription.next_billing_date).toLocaleDateString()}
                    </p>
                  )}
                  <a
                    href="#"
                    className="block w-full text-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Manage Subscription
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-foreground">Free Plan</p>
                    <p className="text-xs text-muted-foreground mt-1">Basic features</p>
                  </div>
                  <a
                    href="#"
                    className="block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Upgrade to Pro
                  </a>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
