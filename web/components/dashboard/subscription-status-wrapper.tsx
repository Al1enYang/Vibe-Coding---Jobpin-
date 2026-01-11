'use client';

import { Suspense } from 'react';
import { SubscriptionStatus } from './subscription-status';
import type { Subscription } from '@/types/database';

interface SubscriptionStatusWrapperProps {
  subscription: Subscription | null;
}

export function SubscriptionStatusWrapper({ subscription }: SubscriptionStatusWrapperProps) {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading subscription status...</div>}>
      <SubscriptionStatus subscription={subscription} />
    </Suspense>
  );
}
