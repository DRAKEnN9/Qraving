import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { checkSubscriptionAccess } from '@/lib/subscription.server';
import dbConnect from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { resolveEffectiveOwnerId } from '@/lib/ownership';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const ownerId = await resolveEffectiveOwnerId(user);
    
    if (!ownerId) {
      return NextResponse.json({ error: 'No owner ID found' }, { status: 404 });
    }

    // Get raw subscription data
    const subscription = await Subscription.findOne({ ownerId });
    
    // Get processed subscription access
    const subscriptionAccess = await checkSubscriptionAccess(user);

    return NextResponse.json({
      debug: {
        userId: user.userId,
        ownerId,
        timestamp: new Date().toISOString(),
      },
      rawSubscription: subscription ? {
        _id: subscription._id,
        status: subscription.status,
        plan: subscription.plan,
        interval: subscription.interval,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        razorpaySubscriptionId: subscription.razorpaySubscriptionId,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      } : null,
      processedAccess: subscriptionAccess,
      accessLogic: {
        explanation: subscription ? getAccessExplanation(subscription) : 'No subscription found'
      }
    });
  } catch (error) {
    console.error('Debug subscription status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getAccessExplanation(subscription: any): string {
  const now = new Date();
  
  if (subscription.status === 'trialing') {
    const trialEnd = subscription.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
    if (!trialEnd) return 'Trial status but no trial end date - SHOULD HAVE ACCESS';
    if (trialEnd > now) return `Trial active until ${trialEnd.toISOString()} - SHOULD HAVE ACCESS`;
    return `Trial expired at ${trialEnd.toISOString()} - SHOULD NOT HAVE ACCESS`;
  }
  
  if (subscription.status === 'active') {
    return 'Active subscription - SHOULD HAVE ACCESS';
  }
  
  if (subscription.status === 'cancelled') {
    if (subscription.cancelAtPeriodEnd === true) {
      const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
      if (!periodEnd) return 'Cancelled at period end but no period end date - SHOULD NOT HAVE ACCESS';
      if (periodEnd > now) return `Cancelled at period end, access until ${periodEnd.toISOString()} - SHOULD HAVE ACCESS`;
      return `Cancelled, period ended at ${periodEnd.toISOString()} - SHOULD NOT HAVE ACCESS`;
    } else {
      return 'Cancelled immediately - SHOULD NOT HAVE ACCESS';
    }
  }
  
  return `Status '${subscription.status}' - SHOULD NOT HAVE ACCESS`;
}
