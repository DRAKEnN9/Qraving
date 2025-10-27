import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest, verifyUserPassword } from '@/lib/auth';
import Subscription from '@/models/Subscription';
import { getRazorpay, RAZORPAY_PLANS, assertPlansConfigured } from '@/lib/razorpay';
import { resolveAccountOwnerPrivilege } from '@/lib/ownership';
import { checkTrialEligibility, markTrialAsUsed } from '@/lib/trialService';

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
    const interval: 'monthly' | 'yearly' = body.interval === 'yearly' ? 'yearly' : 'monthly';
    const contact: string | undefined = body.contact;
    const name: string | undefined = body.name;
    const email: string | undefined = body.email;
    const currentPassword: string | undefined = body.currentPassword;
    const skipTrial: boolean = body.skipTrial || false; // Allow forcing paid subscription
    
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

    const planId = plan === 'advance' ? RAZORPAY_PLANS.advance[interval] : RAZORPAY_PLANS.basic[interval];

    // Check trial eligibility
    const trialEligibility = await checkTrialEligibility(user);
    const shouldStartTrial = !skipTrial && trialEligibility.isEligible;

    console.log('Trial eligibility check:', {
      ownerId,
      isEligible: trialEligibility.isEligible,
      reason: trialEligibility.reason,
      shouldStartTrial,
      skipTrial
    });

    let trialEndsAt: Date | undefined;
    let startAtEpoch: number | undefined;

    if (shouldStartTrial) {
      // Start with 14-day trial
      trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      startAtEpoch = Math.floor(trialEndsAt.getTime() / 1000);
    } else {
      // Immediate start with payment: Do NOT set start_at, Razorpay will start now
      startAtEpoch = undefined;
    }

    // Create or update subscription in DB
    let sub = await Subscription.findOne({ ownerId });
    if (!sub) {
      sub = await Subscription.create({
        ownerId,
        provider: 'razorpay',
        plan,
        interval,
        status: shouldStartTrial ? 'trialing' : 'pending',
        trialEndsAt,
        hasUsedTrial: shouldStartTrial, // Mark trial as used if starting trial
      });
      console.log(`Created new subscription with hasUsedTrial: ${shouldStartTrial}`);
    } else {
      sub.plan = plan;
      sub.interval = interval;
      sub.status = shouldStartTrial ? 'trialing' : 'pending';
      sub.trialEndsAt = trialEndsAt;
      if (shouldStartTrial) {
        sub.hasUsedTrial = true; // Mark trial as used
      }
      await sub.save();
      console.log(`Updated existing subscription with hasUsedTrial: ${sub.hasUsedTrial}`);
    }

    // Mark trial as used if starting trial (for tracking)
    if (shouldStartTrial) {
      console.log(`Marking trial as used for owner: ${ownerId}`);
      await markTrialAsUsed(ownerId);
      
      // Verify the update worked
      const updatedSub = await Subscription.findOne({ ownerId });
      console.log(`Verification - hasUsedTrial is now: ${updatedSub?.hasUsedTrial}`);
    }

    const razorpay = getRazorpay();

    // Create subscription on Razorpay with autopay enabled
    const createPayload: any = {
      plan_id: planId,
      total_count: 120, // Allow long-running subscriptions (10 years)
      customer_notify: 1, // Notify customer via email/SMS
      quantity: 1,
      addons: [],
      notes: {
        ownerId: String(ownerId),
        plan,
        interval,
      },
    };
    
    // Only include notify_info if we have email or contact to avoid Razorpay errors
    if (email || contact) {
      createPayload.notify_info = {};
      if (email) createPayload.notify_info.notify_email = email;
      if (contact) createPayload.notify_info.notify_phone = contact;
    }
    // Only set start_at for a future-dated trial start
    if (shouldStartTrial && startAtEpoch) {
      createPayload.start_at = startAtEpoch;
    }

    console.log('Creating Razorpay subscription with payload:', JSON.stringify(createPayload, null, 2));
    
    let subscription: any;
    try {
      subscription = await razorpay.subscriptions.create(createPayload as any);
      console.log('Razorpay subscription created:', subscription.id, 'status:', subscription.status);
    } catch (razorpayError: any) {
      console.error('Razorpay subscription creation failed:', razorpayError);
      throw new Error(`Razorpay error: ${razorpayError.error?.description || razorpayError.message}`);
    }

    // Update DB with subscription id
    sub.razorpaySubscriptionId = subscription.id;
    await sub.save();
    console.log('Subscription saved to DB with Razorpay ID:', subscription.id);

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      trialEndsAt,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
      interval,
      hasTrial: shouldStartTrial,
      trialEligibility: {
        isEligible: trialEligibility.isEligible,
        reason: trialEligibility.reason,
        message: trialEligibility.message
      },
      checkout: {
        // For Razorpay Checkout subscription flow
        subscription_id: subscription.id,
        name: 'QR Menu Manager',
        description: `${plan === 'advance' ? 'Professional' : 'Essential'} ${interval} subscription${shouldStartTrial ? ' (14-day trial)' : ''}`,
        prefill: {
          name: name || undefined,
          email: email || undefined,
          contact: contact || undefined,
        },
        notes: {
          ownerId: String(ownerId),
          hasTrial: shouldStartTrial ? 'true' : 'false',
        },
      },
    });
  } catch (error: any) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
