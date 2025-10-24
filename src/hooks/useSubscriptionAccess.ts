'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { requiresSubscription } from '@/lib/subscription.shared';

interface SubscriptionStatus {
  hasAccess: boolean;
  status: 'none' | 'trialing' | 'active' | 'cancelled' | 'past_due' | 'incomplete' | 'halted' | 'pending';
  plan?: 'basic' | 'advance';
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  loading: boolean;
}

export function useSubscriptionAccess(): SubscriptionStatus {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    hasAccess: false,
    status: 'none',
    loading: true,
  });

  useEffect(() => {
    if (authLoading) return;

    // If no user and page requires subscription, redirect to login
    if (!user && requiresSubscription(pathname)) {
      router.push('/login');
      return;
    }

    // If user exists, check subscription
    if (user) {
      checkSubscription();
    } else {
      // No user but page doesn't require subscription
      setSubscriptionStatus(prev => ({ ...prev, loading: false }));
    }
  }, [user, authLoading, pathname]);

  // Force re-check every 30 seconds to catch subscription changes
  useEffect(() => {
    if (!user || authLoading) return;

    const interval = setInterval(() => {
      console.log('🔄 Periodic subscription check...');
      checkSubscription();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, authLoading]);

  const checkSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        if (requiresSubscription(pathname)) {
          router.push('/login');
        }
        return;
      }

      const response = await fetch('/api/billing/status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Match server-side logic exactly
        const now = new Date();
        let hasValidAccess = false;

        if (data.status === 'trialing') {
          // Trial users have access until trial ends
          hasValidAccess = !data.trialEndsAt || new Date(data.trialEndsAt) > now;
        } else if (data.status === 'active') {
          // Active subscriptions have access
          hasValidAccess = true;
        } else if (data.status === 'cancelled') {
          // Cancelled subscriptions only have access if:
          // 1. They were cancelled at period end (cancelAtPeriodEnd = true) AND
          // 2. The current period hasn't ended yet
          hasValidAccess = Boolean(
            data.cancelAtPeriodEnd === true &&
            data.currentPeriodEnd &&
            new Date(data.currentPeriodEnd) > now
          );
        }
        // All other statuses have no access

        console.log('Client subscription access check:', {
          status: data.status,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          currentPeriodEnd: data.currentPeriodEnd,
          hasValidAccess,
          now: now.toISOString()
        });

        setSubscriptionStatus({
          hasAccess: hasValidAccess,
          status: data.status || 'none',
          plan: data.plan,
          trialEndsAt: data.trialEndsAt,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
          loading: false,
        });

        // If page requires subscription but user doesn't have access, redirect
        if (requiresSubscription(pathname) && !hasValidAccess) {
          router.push('/?subscription=expired');
        }
      } else {
        // API error - assume no access
        setSubscriptionStatus({
          hasAccess: false,
          status: 'none',
          loading: false,
        });
        
        if (requiresSubscription(pathname)) {
          router.push('/?subscription=error');
        }
      }
    } catch (error) {
      console.error('Subscription check error:', error);
      setSubscriptionStatus({
        hasAccess: false,
        status: 'none',
        loading: false,
      });
      
      if (requiresSubscription(pathname)) {
        router.push('/?subscription=error');
      }
    }
  };

  return subscriptionStatus;
}
