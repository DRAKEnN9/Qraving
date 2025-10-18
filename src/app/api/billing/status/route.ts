import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import Subscription from '@/models/Subscription';
import { resolveEffectiveOwnerId } from '@/lib/ownership';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Resolve effective owner (owner or mapped owner for admin)
    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const sub = await Subscription.findOne({ ownerId });
    if (!sub) {
      return NextResponse.json({
        status: 'none',
      });
    }

    return NextResponse.json({
      status: sub.status,
      provider: sub.provider,
      plan: sub.plan,
      trialEndsAt: sub.trialEndsAt,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    });
  } catch (error: any) {
    console.error('Billing status error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
