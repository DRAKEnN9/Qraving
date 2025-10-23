import { NextRequest, NextResponse } from 'next/server';
import { checkApiSubscriptionAccess } from '@/lib/apiSubscriptionGuard';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // This should block access if subscription is invalid
    const subscriptionCheck = await checkApiSubscriptionAccess(request);
    if (subscriptionCheck) {
      return subscriptionCheck; // Returns 402 Payment Required if no access
    }

    // If we get here, subscription is valid
    const user = getUserFromRequest(request);
    
    return NextResponse.json({
      message: '✅ Access granted! This API is protected by subscription.',
      user: {
        userId: user?.userId,
        email: user?.email,
        role: user?.role
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test protected API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
