import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import Subscription from '@/models/Subscription';
import { getRazorpay } from '@/lib/razorpay';
import { resolveEffectiveOwnerId } from '@/lib/ownership';

export const dynamic = 'force-dynamic';

/**
 * Manual subscription sync endpoint
 * Forces immediate refresh from Razorpay when webhooks are delayed
 */
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownerId = await resolveEffectiveOwnerId(user);
    if (!ownerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    
    const sub = await Subscription.findOne({ ownerId });
    if (!sub || !sub.razorpaySubscriptionId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    console.log(`Manual sync requested for subscription ${sub._id}, current status: ${sub.status}`);

    try {
      const rz = getRazorpay();
      
      // Add small delay to ensure Razorpay has processed the subscription
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const remote: any = await rz.subscriptions.fetch(sub.razorpaySubscriptionId);
      
      if (!remote || !remote.status) {
        console.warn(`No valid remote subscription data for ${sub.razorpaySubscriptionId}`);
        return NextResponse.json({ 
          success: false,
          error: 'Subscription not found on Razorpay',
          note: 'Subscription may still be processing'
        }, { status: 404 });
      }
      
      const mapStatus = (s: string) => {
        switch (s) {
          case 'active': return 'active';
          case 'pending': return 'pending';
          case 'created': return 'pending';
          case 'authenticated': return 'trialing';
          case 'halted': return 'halted';
          case 'cancelled': return 'cancelled';
          case 'completed': return 'active'; // Completed = payment successful
          case 'expired': return 'cancelled';
          default: return sub.status;
        }
      };

      const oldStatus = sub.status;
      const newStatus = mapStatus(remote?.status);
      const epochToDate = (e?: number) => (typeof e === 'number' ? new Date(e * 1000) : undefined);
      
      sub.status = newStatus as any;
      
      // Handle transitions
      if (newStatus === 'trialing') {
        sub.hasUsedTrial = true;
        const trialEnd = epochToDate(remote?.current_end ?? remote?.charge_at);
        if (trialEnd) sub.trialEndsAt = trialEnd;
      }
      
      if (newStatus === 'active') {
        const currentStart = epochToDate(remote?.current_start ?? remote?.start_at);
        const currentEnd = epochToDate(remote?.current_end ?? remote?.charge_at);
        if (currentStart) sub.currentPeriodStart = currentStart;
        if (currentEnd) sub.currentPeriodEnd = currentEnd;
      }
      
      await sub.save();
      
      console.log(`Subscription ${sub._id} synced: ${oldStatus} → ${newStatus}`);
      
      return NextResponse.json({
        success: true,
        oldStatus,
        newStatus,
        razorpayStatus: remote?.status,
        subscription: {
          status: sub.status,
          plan: sub.plan,
          interval: sub.interval,
          trialEndsAt: sub.trialEndsAt,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          hasUsedTrial: sub.hasUsedTrial
        }
      });
      
    } catch (razorpayError: any) {
      console.error('Failed to fetch from Razorpay:', razorpayError);
      return NextResponse.json({ 
        error: 'Failed to sync with Razorpay',
        details: razorpayError.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Sync subscription error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
