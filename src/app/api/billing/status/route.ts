import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import Subscription from '@/models/Subscription';
import { getRazorpay } from '@/lib/razorpay';
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

    let sub = await Subscription.findOne({ ownerId });
    if (!sub) {
      return NextResponse.json({
        status: 'none',
      });
    }

    // Optionally refresh from Razorpay if we're in a non-final state
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const needsRefresh = forceRefresh || sub.status === 'pending' || sub.status === 'incomplete' || sub.status === 'halted' || sub.status === 'past_due';

    if (needsRefresh && sub?.razorpaySubscriptionId) {
      try {
        const rz = getRazorpay();
        const remote: any = await rz.subscriptions.fetch(sub.razorpaySubscriptionId);
        const mapStatus = (s: string) => {
          switch (s) {
            case 'active': return 'active' as const;
            case 'pending': return 'pending' as const;
            case 'created': return 'pending' as const;
            case 'authenticated': return 'pending' as const;
            case 'halted': return 'halted' as const;
            case 'cancelled': return 'cancelled' as const;
            case 'completed': return 'cancelled' as const;
            case 'expired': return 'cancelled' as const;
            default: return sub!.status;
          }
        };
        const newStatus = mapStatus(remote?.status);
        const epochToDate = (e?: number) => (typeof e === 'number' ? new Date(e * 1000) : undefined);
        sub!.status = newStatus;
        sub!.currentPeriodStart = epochToDate(remote?.current_start ?? remote?.start_at) || sub!.currentPeriodStart;
        sub!.currentPeriodEnd = epochToDate(remote?.current_end ?? remote?.charge_at) || sub!.currentPeriodEnd;
        await sub!.save();
      } catch (e) {
        console.warn('Failed to refresh subscription from Razorpay:', e);
      }
      // Re-read to ensure fresh values
      sub = await Subscription.findOne({ ownerId });
    }

    if (!sub) {
      return NextResponse.json({
        status: 'none',
      });
    }

    return NextResponse.json({
      status: sub.status,
      provider: sub.provider,
      plan: sub.plan,
      interval: sub.interval,
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
