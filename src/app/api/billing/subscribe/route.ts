import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest, verifyUserPassword } from '@/lib/auth';
import Subscription from '@/models/Subscription';
import { getRazorpay, RAZORPAY_PLANS, assertPlansConfigured } from '@/lib/razorpay';
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    assertPlansConfigured();

    const body = await request.json();
    const plan: 'basic' | 'advance' = body.plan === 'advance' ? 'advance' : 'basic';
    const contact: string | undefined = body.contact;
    const name: string | undefined = body.name;
    const email: string | undefined = body.email;
    const currentPassword: string | undefined = body.currentPassword;
    
    // Check if account has existing subscription to determine if password is needed
    const existingSub = await Subscription.findOne({ ownerId });
    if (existingSub && (existingSub.status === 'active' || existingSub.status === 'trialing')) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password required to change subscription plan' }, { status: 400 });
      }
      
      const isValidPassword = await verifyUserPassword(user.userId, currentPassword);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
    }

    const planId = plan === 'advance' ? RAZORPAY_PLANS.advance : RAZORPAY_PLANS.basic;

    // Calculate 14 day trial end
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const startAtEpoch = Math.floor(trialEndsAt.getTime() / 1000);

    // Create or reuse subscription placeholder in DB (trialing state)
    let sub = await Subscription.findOne({ ownerId });
    if (!sub) {
      sub = await Subscription.create({
        ownerId,
        provider: 'razorpay',
        plan,
        status: 'trialing',
        trialEndsAt,
      });
    } else {
      sub.plan = plan;
      sub.status = 'trialing';
      sub.trialEndsAt = trialEndsAt;
      await sub.save();
    }

    const razorpay = getRazorpay();

    // Create subscription on Razorpay with future start (after trial)
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      customer_notify: 1,
      start_at: startAtEpoch,
      notes: {
        ownerId: String(ownerId),
        plan,
      },
    } as any);

    // Update DB with subscription id
    sub.razorpaySubscriptionId = subscription.id;
    await sub.save();

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      trialEndsAt,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
      checkout: {
        // For Razorpay Checkout subscription flow
        subscription_id: subscription.id,
        name: 'QR Menu Manager',
        description: `${plan === 'advance' ? 'Advance' : 'Basic'} plan subscription`,
        prefill: {
          name: name || undefined,
          email: email || undefined,
          contact: contact || undefined,
        },
        notes: {
          ownerId: String(ownerId),
        },
      },
    });
  } catch (error: any) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
