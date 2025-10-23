import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { checkSubscriptionAccess } from '@/lib/subscription.server';
import { publicPages } from '@/lib/subscription.shared';

/**
 * Middleware to check subscription access for API routes
 * Returns null if access is allowed, or NextResponse with error if blocked
 */
export async function checkApiSubscriptionAccess(
  request: NextRequest,
  pathname?: string
): Promise<NextResponse | null> {
  const path = pathname || request.nextUrl.pathname;
  
  // Allow public API routes
  if (publicPages.some(page => path.startsWith(page))) {
    return null;
  }
  
  // Allow webhook and auth routes
  if (path.startsWith('/api/auth/') || 
      path.startsWith('/api/billing/webhook') ||
      path.startsWith('/api/billing/subscribe') ||
      path.startsWith('/api/billing/checkout')) {
    return null;
  }

  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptionAccess = await checkSubscriptionAccess(user);
    
    if (!subscriptionAccess.hasAccess) {
      return NextResponse.json(
        { 
          error: 'Subscription required', 
          code: 'SUBSCRIPTION_REQUIRED',
          status: subscriptionAccess.status 
        }, 
        { status: 402 } // Payment Required
      );
    }

    // Access allowed
    return null;
  } catch (error) {
    console.error('API subscription check error:', error);
    return NextResponse.json({ error: 'Subscription validation failed' }, { status: 500 });
  }
}

/**
 * Decorator for API route handlers to check subscription access
 */
export function withSubscriptionAccess(handler: Function) {
  return async (request: NextRequest, context?: any) => {
    const subscriptionCheck = await checkApiSubscriptionAccess(request);
    if (subscriptionCheck) {
      return subscriptionCheck;
    }
    
    return handler(request, context);
  };
}
