'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Subscription } from '@/types/database';

// Format next billing date - simple manual formatting to avoid locale issues
// Moved outside component to avoid re-creation on each render
const formatBillingDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return null;
  }
};

interface SubscriptionStatusProps {
  subscription: Subscription | null;
}

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if development mode - only after client mount to avoid hydration mismatch
  const isDevelopment = useMemo(() => {
    if (!isMounted) return false;
    return process.env.NODE_ENV === 'development';
  }, [isMounted]);

  // Set mounted state on client side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-refresh when returning from Stripe Portal (portal_return=true)
  const isSyncing = searchParams.get('portal_return') === 'true';

  useEffect(() => {
    if (isSyncing) {
      // Small delay to ensure webhook has time to process
      const timer = setTimeout(() => {
        window.location.reload();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSyncing]);

  // Check if subscription exists and is active
  const hasActiveSubscription = subscription?.active && subscription?.plan === 'pro';

  // Check if user just returned from Stripe Checkout (pending state)
  // URL will have session_id param but subscription won't be active yet
  const isPending = !hasActiveSubscription; // Simplified: if no active sub, show Free plan

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Failed to create portal session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Reload the page to fetch fresh data from server
    window.location.reload();
  };

  const handleReset = async () => {
    if (!confirm('Reset subscription? This will delete your subscription record for testing.')) {
      return;
    }
    setIsResetting(true);
    try {
      const response = await fetch('/api/stripe/reset', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to reset subscription:', error);
    } finally {
      setIsResetting(false);
    }
  };

  // Pro plan (active subscription)
  if (hasActiveSubscription) {
    const nextBillingDate = formatBillingDate(subscription.next_billing_date);

    return (
      <div className="space-y-4">
        {isSyncing && (
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
            <p className="text-xs text-blue-500">Syncing subscription status...</p>
          </div>
        )}
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-2">
          <p className="text-sm font-medium text-green-500">Pro – $9 / month</p>
          {nextBillingDate && (
            <p className="text-xs text-green-500/80">Next billing: {nextBillingDate}</p>
          )}
        </div>

        <button
          onClick={handleManage}
          disabled={isLoading}
          className="block w-full text-center px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Manage Subscription'}
        </button>

        {/* Dev-only reset button */}
        {isDevelopment && (
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="block w-full text-center px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/20"
          >
            {isResetting ? 'Resetting...' : 'Reset Subscription (Dev)'}
          </button>
        )}
      </div>
    );
  }

  // Free plan (no active subscription)
  return (
    <div className="space-y-4">
      {isSyncing && (
        <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
          <p className="text-xs text-blue-500">Syncing subscription status...</p>
        </div>
      )}
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm font-medium text-foreground">Free Plan</p>
        <p className="text-xs text-muted-foreground mt-1">Basic features</p>
      </div>

      <button
        onClick={handleUpgrade}
        disabled={isLoading}
        className="block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Loading...' : 'Upgrade to Pro'}
      </button>

      {/* Refresh button for pending state */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="block w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {isRefreshing ? 'Refreshing...' : 'Refresh status'}
      </button>

      {/* Dev-only reset button */}
      {isDevelopment && subscription && (
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="block w-full text-center px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/20"
        >
          {isResetting ? 'Resetting...' : 'Reset Subscription (Dev)'}
        </button>
      )}
    </div>
  );
}
