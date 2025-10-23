import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest, verifyUserPassword } from '@/lib/auth';
import Subscription from '@/models/Subscription';
import { getRazorpay } from '@/lib/razorpay';
import { resolveAccountOwnerPrivilege } from '@/lib/ownership';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const ownerId = await resolveAccountOwnerPrivilege(user);
    if (!ownerId) {
      return NextResponse.json({ error: 'Only owner can cancel subscription' }, { status: 403 });
    }
    
    const body = await request.json();
    const { currentPassword, atPeriodEnd } = body || {};
    
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password required to cancel subscription' }, { status: 400 });
    }

    await dbConnect();
    
    // Verify password before proceeding with cancellation
    const isValidPassword = await verifyUserPassword(user.userId, currentPassword);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
    const sub = await Subscription.findOne({ ownerId });
    if (!sub || !sub.razorpaySubscriptionId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    console.log('Cancelling subscription:', {
      subscriptionId: sub._id,
      currentStatus: sub.status,
      atPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      currentPeriodEnd: sub.currentPeriodEnd
    });

    // Handle trial subscriptions separately - Razorpay doesn't allow canceling trials
    if (sub.status === 'trialing') {
      // For trial subscriptions, just mark as cancelled in our DB
      sub.status = 'cancelled';
      sub.cancelAtPeriodEnd = false; // Trial cancellations are immediate
      sub.currentPeriodEnd = undefined; // Clear period end for trials
      // Stamp trial end to the cancellation moment to prevent re-trial eligibility
      sub.trialEndsAt = new Date();
      sub.hasUsedTrial = true; // Ensure trial is marked as used when cancelled
      await sub.save();
      console.log('Trial subscription cancelled immediately, hasUsedTrial set to true');
    } else {
      // For active subscriptions, use Razorpay cancel API
      const rz = getRazorpay();
      const cancelAtCycleEnd = atPeriodEnd ? 1 : 0;
      
      try {
        await rz.subscriptions.cancel(sub.razorpaySubscriptionId, { cancel_at_cycle_end: cancelAtCycleEnd } as any);
        
        if (cancelAtCycleEnd === 1) {
          // Keep active until period end; mark flag
          sub.cancelAtPeriodEnd = true;
          // Status stays 'active' until period end
          console.log('Subscription cancelled at period end, access continues until:', sub.currentPeriodEnd);
        } else {
          // Immediate cancel
          sub.status = 'cancelled';
          sub.cancelAtPeriodEnd = false;
          sub.currentPeriodEnd = undefined; // Clear period end for immediate cancellation
          console.log('Subscription cancelled immediately');
        }
        await sub.save();
      } catch (razorpayError: any) {
        // If Razorpay cancel fails, still mark as cancelled in our DB for consistency
        console.warn('Razorpay cancel failed, marking as cancelled in DB:', razorpayError);
        sub.status = 'cancelled';
        sub.cancelAtPeriodEnd = false;
        sub.currentPeriodEnd = undefined; // Clear period end for failed/immediate cancellation
        await sub.save();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
