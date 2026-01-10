'use client';

import type { UserProfile, ResumeParsingResult, Subscription } from '@/types/database';
import { calculateProgressScore, getProgressColor } from '@/lib/dashboard';

interface ProfileProgressProps {
  profile: UserProfile | null;
  resume: ResumeParsingResult | null;
  subscription: Subscription | null;
}

export function ProfileProgress({ profile, resume, subscription }: ProfileProgressProps) {
  const score = calculateProgressScore(profile, resume, subscription);
  const progressColor = getProgressColor(score.total);

  return (
    <div className="mb-8 p-6 bg-card border border-border rounded-xl">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-foreground">Profile Completion</h2>
        <span className="text-2xl font-bold text-foreground">{score.total}%</span>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className={`h-full ${progressColor} transition-all duration-500 ease-out`}
          style={{ width: `${score.total}%` }}
        />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        {/* Role Name */}
        <div className={`flex items-center gap-2 ${score.roleName > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
          <span className={`w-2 h-2 rounded-full ${score.roleName > 0 ? 'bg-green-500' : 'bg-muted-foreground'}`} />
          <span>Role Name</span>
          <span className="ml-auto font-medium">15%</span>
        </div>

        {/* Profile */}
        <div className={`flex items-center gap-2 ${score.profile > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
          <span className={`w-2 h-2 rounded-full ${score.profile > 0 ? 'bg-green-500' : 'bg-muted-foreground'}`} />
          <span>Profile</span>
          <span className="ml-auto font-medium">40%</span>
        </div>

        {/* Work Type */}
        <div className={`flex items-center gap-2 ${score.workType > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
          <span className={`w-2 h-2 rounded-full ${score.workType > 0 ? 'bg-green-500' : 'bg-muted-foreground'}`} />
          <span>Work Type</span>
          <span className="ml-auto font-medium">10%</span>
        </div>

        {/* Resume */}
        <div className={`flex items-center gap-2 ${score.resume > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
          <span className={`w-2 h-2 rounded-full ${score.resume > 0 ? 'bg-green-500' : 'bg-muted-foreground'}`} />
          <span>Resume</span>
          <span className="ml-auto font-medium">35%</span>
        </div>
      </div>
    </div>
  );
}
