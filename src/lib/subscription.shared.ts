// Client-safe subscription utilities (no server imports)

/**
 * Pages that don't require subscription access
 */
export const publicPages = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/billing/subscribe',
  '/billing/checkout',
  '/menu/demo-restaurant', // Demo menu
  '/api/auth/me',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/google',
  '/api/billing/subscribe',
  '/api/billing/checkout',
  '/api/billing/webhook',
  '/api/billing/status', // Allow checking subscription status
  '/api/billing/trial-eligibility', // Allow checking trial eligibility
  '/api/webhooks/razorpay', // Allow Razorpay webhooks
];

/**
 * Check if a path requires subscription access
 */
export function requiresSubscription(pathname: string): boolean {
  // Public pages and static assets don't require subscription
  if (publicPages.some((page) => pathname.startsWith(page))) {
    return false;
  }

  // Static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/public/')
  ) {
    return false;
  }

  // All other pages require subscription
  return true;
}
