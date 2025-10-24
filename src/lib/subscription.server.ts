import dbConnect from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { TokenPayload } from '@/lib/auth';
import { resolveEffectiveOwnerId } from '@/lib/ownership';

export interface SubscriptionAccess {
  hasAccess: boolean;
  status: 'none' | 'trialing' | 'active' | 'cancelled' | 'past_due' | 'incomplete' | 'halted' | 'pending';
  plan?: 'basic' | 'advance';
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

/**
 * SERVER-ONLY: Check if user has valid subscription access
 */
export async function checkSubscriptionAccess(user: TokenPayload): Promise<SubscriptionAccess> {
  try {
    await dbConnect();

    // Resolve effective owner ID using the ownership utility
    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) {
      return { hasAccess: false, status: 'none' };
    }

    const subscription = await Subscription.findOne({ ownerId });

    if (!subscription) {
      return { hasAccess: false, status: 'none' };
    }

    // Check if subscription provides access
    const now = new Date();
    let hasValidAccess = false;

    if (subscription.status === 'trialing') {
      // Trial users have access until trial ends
      hasValidAccess = !subscription.trialEndsAt || new Date(subscription.trialEndsAt) > now;
    } else if (subscription.status === 'active') {
      // Active subscriptions have access
      hasValidAccess = true;
    } else if (subscription.status === 'cancelled') {
      // Cancelled subscriptions only have access if:
      // 1. They were cancelled at period end (cancelAtPeriodEnd = true) AND
      // 2. The current period hasn't ended yet
      hasValidAccess = Boolean(
        subscription.cancelAtPeriodEnd === true &&
        subscription.currentPeriodEnd &&
        new Date(subscription.currentPeriodEnd) > now
      );
    }
    // All other statuses (past_due, incomplete, etc.) have no access

    console.log('Subscription access check:', {
      ownerId,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
      hasValidAccess,
      now: now.toISOString()
    });

    return {
      hasAccess: hasValidAccess,
      status: subscription.status,
      plan: subscription.plan,
      trialEndsAt: subscription.trialEndsAt ? subscription.trialEndsAt.toISOString() : undefined,
      currentPeriodEnd: subscription.currentPeriodEnd ? subscription.currentPeriodEnd.toISOString() : undefined,
      cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd),
    };
  } catch (error) {
    console.error('Subscription access check error:', error);
    return { hasAccess: false, status: 'none' };
  }
}
