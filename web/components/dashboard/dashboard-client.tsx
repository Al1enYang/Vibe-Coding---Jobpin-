'use client';

import { useState, useEffect } from 'react';
import { hasSeenDashboardGuide } from '@/lib/actions/dashboard-guide';
import { GuideHighlight } from './guide-highlight';
import type { UserProfile, ResumeParsingResult, Subscription } from '@/types/database';

interface DashboardClientProps {
  profile: UserProfile | null;
  resume: ResumeParsingResult | null;
  subscription: Subscription | null;
  children: React.ReactNode;
}

const LOCAL_STORAGE_KEY = 'has_seen_dashboard_tour';

export function DashboardClient({ profile, resume, subscription, children }: DashboardClientProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkGuideStatus = async () => {
      // Check localStorage first
      const hasSeenLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (hasSeenLocal === 'true') {
        setIsChecking(false);
        return;
      }

      // Check DB
      try {
        const hasSeenDb = await hasSeenDashboardGuide();
        if (hasSeenDb) {
          // Sync localStorage with DB
          localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
        } else {
          // Show guide
          setShowGuide(true);
        }
      } catch (error) {
        console.warn('[DashboardClient] Failed to check guide status:', error);
        // On error, don't show guide to avoid blocking user
      } finally {
        setIsChecking(false);
      }
    };

    checkGuideStatus();
  }, []);

  const handleGuideComplete = () => {
    setShowGuide(false);
  };

  return (
    <>
      {children}
      {showGuide && !isChecking && <GuideHighlight onComplete={handleGuideComplete} />}
    </>
  );
}
