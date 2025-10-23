import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Subscription from '@/models/Subscription';

export const dynamic = 'force-dynamic';

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  // Razorpay sends signature in format: algorithm=hash
  const receivedHash = signature.includes('=') ? signature.split('=')[1] : signature;
  return expected === receivedHash;
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
    console.warn('Webhook signature verification failed:', { signature, bodyLength: bodyText.length });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  console.log('✅ Webhook signature verified');

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
  
  console.log('📧 Webhook received:', { event, razorpaySubscriptionId });
  
  if (!razorpaySubscriptionId) {
    console.log('⚠️ No subscription ID found in webhook payload');
    return NextResponse.json({ ok: true, note: 'No subscription id in payload' });
  }

  await dbConnect();
  const sub = await Subscription.findOne({ razorpaySubscriptionId });
  if (!sub) {
    console.log('⚠️ No local subscription found for Razorpay ID:', razorpaySubscriptionId);
    return NextResponse.json({ ok: true, note: 'No local subscription found for id' });
  }

  console.log('🔍 Found subscription:', { _id: sub._id, currentStatus: sub.status, ownerId: sub.ownerId });

  try {
    switch (event) {
      case 'subscription.activated': {
        const currentStart = epochToDate(subEntity?.current_start ?? subEntity?.start_at);
        const currentEnd = epochToDate(subEntity?.current_end ?? subEntity?.charge_at);
        console.log('🟢 Activating subscription:', { 
          id: sub._id, 
          from: sub.status, 
          to: 'active',
          currentStart: currentStart?.toISOString(),
          currentEnd: currentEnd?.toISOString()
        });
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
      case 'invoice.paid':
      case 'payment.captured':
      case 'payment.authorized': {
        console.log(`💳 Payment event ${event} for subscription:`, { id: sub._id, currentStatus: sub.status });
        // If we were pending and a payment/invoice came in for this subscription, mark active
        if (sub.status === 'pending') {
          console.log('🟢 Promoting pending subscription to active after payment');
          sub.status = 'active';
          // Try to capture period end if present on invoice
          const endEpoch = invEntity?.period_end ?? invEntity?.billing_end ?? undefined;
          const startEpoch = invEntity?.period_start ?? invEntity?.billing_start ?? undefined;
          const startDate = epochToDate(startEpoch);
          const endDate = epochToDate(endEpoch);
          if (startDate) sub.currentPeriodStart = startDate;
          if (endDate) sub.currentPeriodEnd = endDate;
          await sub.save();
        } else {
          console.log('📝 Payment received but subscription already active, no action needed');
        }
        break;
      }
      default: {
        // Ignore other events gracefully
        break;
      }
    }
  } catch (e: any) {
    console.error('❌ Webhook processing error:', e);
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }

  console.log('✅ Webhook processed successfully');
  return NextResponse.json({ ok: true });
}
