'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';
import { requiresSubscription } from '@/lib/subscription.shared';
import { AlertCircle, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionGuardProps {
  children: ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const pathname = usePathname();
  const { hasAccess, status, loading } = useSubscriptionAccess();

  // Debug logging for subscription guard
  console.log('SubscriptionGuard check:', {
    pathname,
    hasAccess,
    status,
    loading,
    requiresSubscription: requiresSubscription(pathname)
  });

  // Don't guard public pages
  if (!requiresSubscription(pathname)) {
    return <>{children}</>;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <CreditCard className="mx-auto h-12 w-12 animate-pulse text-orange-600" />
          <p className="mt-4 text-gray-600">Checking subscription...</p>
        </div>
      </div>
    );
  }

  // Show access denied for expired/no subscription
  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mx-auto">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            {status === 'cancelled' ? 'Subscription Cancelled' : 'Subscription Required'}
          </h1>
          
          <p className="mb-6 text-gray-600">
            {status === 'cancelled' 
              ? 'Your subscription has been cancelled. Please subscribe again to continue using QR Menu Manager.'
              : 'You need an active subscription to access this feature. Start your free trial today!'}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/billing/subscribe?plan=advance&interval=yearly"
              className="rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-700"
            >
              Start Free Trial
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Go to Homepage
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </div>
    );
  }

  // User has access, render protected content
  return <>{children}</>;
}
