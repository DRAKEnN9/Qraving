import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest, verifyUserPassword } from '@/lib/auth';
import Subscription from '@/models/Subscription';
import { getRazorpay } from '@/lib/razorpay';
import { resolveAccountOwnerPrivilege } from '@/lib/ownership';

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
    const { currentPassword } = body || {};
    
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

    const rz = getRazorpay();
    await rz.subscriptions.cancel(sub.razorpaySubscriptionId, { cancel_at_cycle_end: 0 } as any);

    sub.status = 'cancelled';
    sub.cancelAtPeriodEnd = false;
    await sub.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
