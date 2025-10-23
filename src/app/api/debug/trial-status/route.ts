import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { checkTrialEligibility } from '@/lib/trialService';
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
    
    // Get processed trial eligibility
    const trialEligibility = await checkTrialEligibility(user);

    const now = new Date();

    return NextResponse.json({
      debug: {
        userId: user.userId,
        ownerId,
        timestamp: now.toISOString(),
      },
      rawSubscription: subscription ? {
        _id: subscription._id,
        status: subscription.status,
        plan: subscription.plan,
        interval: subscription.interval,
        hasUsedTrial: subscription.hasUsedTrial,
        hasUsedTrialType: typeof subscription.hasUsedTrial,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      } : null,
      trialEligibility,
      expectedBehavior: {
        shouldShowTrialMessage: subscription?.status === 'trialing',
        shouldAllowNewTrial: !subscription || subscription.hasUsedTrial !== true,
        currentTrialActive: subscription?.status === 'trialing' && 
                           subscription?.trialEndsAt && 
                           new Date(subscription.trialEndsAt) > now,
        explanation: getExplanation(subscription)
      }
    });
  } catch (error) {
    console.error('Debug trial status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getExplanation(subscription: any): string {
  if (!subscription) return 'No subscription found - user is eligible for trial';
  
  if (subscription.hasUsedTrial === true) {
    return `User has used trial (hasUsedTrial: ${subscription.hasUsedTrial}). No future trials allowed.`;
  }
  
  if (subscription.hasUsedTrial === false) {
    return `User has NOT used trial (hasUsedTrial: ${subscription.hasUsedTrial}). Trial allowed.`;
  }
  
  if (subscription.hasUsedTrial === undefined || subscription.hasUsedTrial === null) {
    return `hasUsedTrial field missing (${subscription.hasUsedTrial}). This needs to be fixed - run /api/admin/fix-trial-tracking`;
  }
  
  return `Unclear trial status: hasUsedTrial = ${subscription.hasUsedTrial}`;
}
