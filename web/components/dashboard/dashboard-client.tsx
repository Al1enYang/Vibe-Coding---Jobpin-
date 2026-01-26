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
const IS_DEV = process.env.NODE_ENV === 'development';

export function DashboardClient({ profile, resume, subscription, children }: DashboardClientProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

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

  const handleResetGuide = async () => {
    if (!confirm('Reset dashboard guide? This will allow you to see the guide again.')) {
      return;
    }
    setIsResetting(true);
    try {
      // Reset localStorage
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      // Reset database
      await fetch('/api/debug/reset-guide', { method: 'POST' });

      // Reload page to show guide
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset guide:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      {children}

      {/* Debug button for development */}
      {IS_DEV && (
        <button
          onClick={handleResetGuide}
          disabled={isResetting}
          className="fixed bottom-4 right-4 z-50 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 text-xs rounded-lg border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
          title="Reset dashboard guide for testing"
        >
          {isResetting ? 'Resetting...' : 'Reset Guide (Dev)'}
        </button>
      )}

      {showGuide && !isChecking && <GuideHighlight onComplete={handleGuideComplete} />}
    </>
  );
}
