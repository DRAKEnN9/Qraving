import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Subscription from '@/models/Subscription';

export const dynamic = 'force-dynamic';

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return expected === signature;
}

function epochToDate(epoch?: number | null): Date | undefined {
  if (!epoch || typeof epoch !== 'number') return undefined;
  try {
    return new Date(epoch * 1000);
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const bodyText = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!verifySignature(bodyText, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(bodyText);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event: string = body?.event || '';
  const subEntity = body?.payload?.subscription?.entity;
  const payEntity = body?.payload?.payment?.entity;
  const invEntity = body?.payload?.invoice?.entity;

  const razorpaySubscriptionId: string | undefined = subEntity?.id || payEntity?.subscription_id || invEntity?.subscription_id;
  if (!razorpaySubscriptionId) {
    return NextResponse.json({ ok: true, note: 'No subscription id in payload' });
  }

  await dbConnect();
  const sub = await Subscription.findOne({ razorpaySubscriptionId });
  if (!sub) {
    return NextResponse.json({ ok: true, note: 'No local subscription found for id' });
  }

  try {
    switch (event) {
      case 'subscription.authenticated': {
        // Razorpay sets "authenticated" for trial subscriptions
        const trialEnd = epochToDate(subEntity?.current_end ?? subEntity?.charge_at);
        sub.status = 'trialing';
        sub.hasUsedTrial = true; // Mark trial as used
        if (trialEnd) sub.trialEndsAt = trialEnd;
        await sub.save();
        console.log(`Subscription ${sub._id} set to trialing, trial ends at:`, trialEnd);
        break;
      }
      case 'subscription.activated': {
        const currentStart = epochToDate(subEntity?.current_start ?? subEntity?.start_at);
        const currentEnd = epochToDate(subEntity?.current_end ?? subEntity?.charge_at);
        sub.status = 'active';
        if (currentStart) sub.currentPeriodStart = currentStart;
        if (currentEnd) sub.currentPeriodEnd = currentEnd;
        await sub.save();
        break;
      }
      case 'subscription.pending': {
        sub.status = 'pending';
        await sub.save();
        break;
      }
      case 'subscription.halted': {
        sub.status = 'halted';
        await sub.save();
        break;
      }
      case 'subscription.paused': {
        sub.status = 'halted';
        await sub.save();
        break;
      }
      case 'subscription.cancelled': {
        sub.status = 'cancelled';
        sub.cancelAtPeriodEnd = false;
        sub.currentPeriodEnd = undefined;
        await sub.save();
        break;
      }
      case 'subscription.completed': {
        // Subscription completed (one-time payment processed)
        sub.status = 'active';
        const currentStart = epochToDate(subEntity?.current_start ?? subEntity?.start_at);
        const currentEnd = epochToDate(subEntity?.current_end ?? subEntity?.charge_at);
        if (currentStart) sub.currentPeriodStart = currentStart;
        if (currentEnd) sub.currentPeriodEnd = currentEnd;
        await sub.save();
        console.log(`Subscription ${sub._id} completed and activated`);
        break;
      }
      case 'subscription.charged': {
        // Recurring payment processed successfully
        if (sub.status !== 'active') {
          sub.status = 'active';
          await sub.save();
        }
        break;
      }
      case 'invoice.paid':
      case 'payment.captured':
      case 'payment.authorized': {
        // Payment successful - activate subscription immediately
        if (sub.status === 'pending' || sub.status === 'incomplete') {
          sub.status = 'active';
          // Try to capture period end if present on invoice
          const endEpoch = invEntity?.period_end ?? invEntity?.billing_end ?? undefined;
          const startEpoch = invEntity?.period_start ?? invEntity?.billing_start ?? undefined;
          const startDate = epochToDate(startEpoch);
          const endDate = epochToDate(endEpoch);
          if (startDate) sub.currentPeriodStart = startDate;
          if (endDate) sub.currentPeriodEnd = endDate;
          await sub.save();
          console.log(`Payment successful - subscription ${sub._id} activated`);
        }
        break;
      }
      default: {
        // Ignore other events gracefully
        break;
      }
    }
  } catch (e: any) {
    console.error('Webhook processing error:', e);
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
