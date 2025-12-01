import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import Payment from '@/models/Payment';

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

  const razorpaySubscriptionId: string | undefined =
    subEntity?.id || payEntity?.subscription_id || invEntity?.subscription_id;
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
        // Clear any prior trial marker once active
        sub.trialEndsAt = undefined;
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
        // Clear prior trial marker on activation
        sub.trialEndsAt = undefined;
        const currentStart = epochToDate(subEntity?.current_start ?? subEntity?.start_at);
        const currentEnd = epochToDate(subEntity?.current_end ?? subEntity?.charge_at);
        if (currentStart) sub.currentPeriodStart = currentStart;
        if (currentEnd) sub.currentPeriodEnd = currentEnd;
        await sub.save();
        console.log(`Subscription ${sub._id} completed and activated`);
        break;
      }
      case 'subscription.charged': {
        // Recurring payment processed successfully - update billing period
        // Clear any past_due status from previous failed attempts
        sub.status = 'active';
        // Clear prior trial marker on charge
        sub.trialEndsAt = undefined;
        const currentStart = epochToDate(subEntity?.current_start ?? subEntity?.start_at);
        const currentEnd = epochToDate(subEntity?.current_end ?? subEntity?.charge_at);
        if (currentStart) sub.currentPeriodStart = currentStart;
        if (currentEnd) sub.currentPeriodEnd = currentEnd;
        await sub.save();
        console.log(
          `Subscription ${sub._id} charged successfully, period: ${currentStart?.toISOString()} - ${currentEnd?.toISOString()}`
        );

        // Try to record the successful charge as a payment as well
        try {
          const filter: any = payEntity?.id
            ? { razorpayPaymentId: payEntity.id }
            : invEntity?.id
              ? { razorpayInvoiceId: invEntity.id }
              : { _id: undefined };
          const paidAt =
            epochToDate(payEntity?.captured_at) || epochToDate(invEntity?.paid_at) || new Date();
          await Payment.findOneAndUpdate(
            filter,
            {
              ownerId: sub.ownerId,
              subscriptionId: sub._id,
              razorpayPaymentId: payEntity?.id,
              razorpayInvoiceId: invEntity?.id || payEntity?.invoice_id,
              amount:
                typeof payEntity?.amount === 'number'
                  ? payEntity.amount
                  : typeof invEntity?.amount_paid === 'number'
                    ? invEntity.amount_paid
                    : 0,
              currency: payEntity?.currency || invEntity?.currency || 'INR',
              status: 'captured',
              method: payEntity?.method,
              description: invEntity?.description || payEntity?.description,
              invoiceUrl: invEntity?.short_url || invEntity?.invoice_url || invEntity?.receipt,
              paidAt,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } catch (e) {
          console.warn('Failed to upsert payment record for subscription.charged:', e);
        }
        break;
      }
      case 'payment.refunded': {
        // Mark payment as refunded in our records
        try {
          const filter: any = payEntity?.id
            ? { razorpayPaymentId: payEntity.id }
            : invEntity?.id
              ? { razorpayInvoiceId: invEntity.id }
              : { _id: undefined };
          await Payment.findOneAndUpdate(
            filter,
            {
              ownerId: sub.ownerId,
              subscriptionId: sub._id,
              razorpayPaymentId: payEntity?.id,
              razorpayInvoiceId: invEntity?.id || payEntity?.invoice_id,
              amount:
                typeof payEntity?.amount_refunded === 'number' && payEntity.amount_refunded > 0
                  ? payEntity.amount_refunded
                  : typeof payEntity?.amount === 'number'
                    ? payEntity.amount
                    : 0,
              currency: payEntity?.currency || invEntity?.currency || 'INR',
              status: 'refunded',
              method: payEntity?.method,
              description: invEntity?.description || payEntity?.description,
              invoiceUrl: invEntity?.short_url || invEntity?.invoice_url || invEntity?.receipt,
              paidAt:
                epochToDate(payEntity?.captured_at) || epochToDate(invEntity?.paid_at) || undefined,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } catch (e) {
          console.warn('Failed to upsert refunded payment record:', e);
        }
        break;
      }
      case 'payment.failed': {
        // Recurring payment failed - mark as past_due
        if (payEntity?.subscription_id === razorpaySubscriptionId) {
          sub.status = 'past_due';
          await sub.save();
          console.log(`Payment failed for subscription ${sub._id}, status: past_due`);

          // Record failed payment
          try {
            const filter: any = payEntity?.id
              ? { razorpayPaymentId: payEntity.id }
              : invEntity?.id
                ? { razorpayInvoiceId: invEntity.id }
                : { _id: undefined }; // will not match anything if no ids
            const paidAt =
              epochToDate(payEntity?.captured_at) || epochToDate(payEntity?.created_at);
            await Payment.findOneAndUpdate(
              filter,
              {
                ownerId: sub.ownerId,
                subscriptionId: sub._id,
                razorpayPaymentId: payEntity?.id,
                razorpayInvoiceId: invEntity?.id || payEntity?.invoice_id,
                amount:
                  typeof payEntity?.amount === 'number'
                    ? payEntity.amount
                    : typeof invEntity?.amount_paid === 'number'
                      ? invEntity.amount_paid
                      : 0,
                currency: payEntity?.currency || invEntity?.currency || 'INR',
                status: 'failed',
                method: payEntity?.method,
                description: invEntity?.description || payEntity?.description,
                invoiceUrl: invEntity?.short_url || invEntity?.invoice_url || invEntity?.receipt,
                paidAt: paidAt,
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } catch (e) {
            console.warn('Failed to upsert failed payment record:', e);
          }
        }
        break;
      }
      case 'invoice.paid':
      case 'payment.captured':
      case 'payment.authorized': {
        // Payment successful - mark as active (regardless of prior transient status) and clear trial markers
        sub.status = 'active';
        sub.trialEndsAt = undefined;
        // Try to capture period dates from invoice if present
        const endEpoch = invEntity?.period_end ?? invEntity?.billing_end ?? undefined;
        const startEpoch = invEntity?.period_start ?? invEntity?.billing_start ?? undefined;
        const startDate = epochToDate(startEpoch);
        const endDate = epochToDate(endEpoch);
        if (startDate) sub.currentPeriodStart = startDate;
        if (endDate) sub.currentPeriodEnd = endDate;
        await sub.save();
        console.log(`Payment successful - subscription ${sub._id} activated`);

        // Record/Upsert payment (authorized/captured/invoice.paid)
        try {
          const filter: any = payEntity?.id
            ? { razorpayPaymentId: payEntity.id }
            : invEntity?.id
              ? { razorpayInvoiceId: invEntity.id }
              : { _id: undefined }; // will not match anything if no ids
          const statusMap: Record<string, 'authorized' | 'captured'> = {
            'payment.authorized': 'authorized',
            'payment.captured': 'captured',
            'invoice.paid': 'captured',
          };
          const status = statusMap[event] || 'captured';
          const paidAt =
            epochToDate(payEntity?.captured_at) ||
            epochToDate(invEntity?.paid_at) ||
            (status === 'captured' ? new Date() : undefined);

          await Payment.findOneAndUpdate(
            filter,
            {
              ownerId: sub.ownerId,
              subscriptionId: sub._id,
              razorpayPaymentId: payEntity?.id,
              razorpayInvoiceId: invEntity?.id || payEntity?.invoice_id,
              amount:
                typeof payEntity?.amount === 'number'
                  ? payEntity.amount
                  : typeof invEntity?.amount_paid === 'number'
                    ? invEntity.amount_paid
                    : 0,
              currency: payEntity?.currency || invEntity?.currency || 'INR',
              status,
              method: payEntity?.method,
              description: invEntity?.description || payEntity?.description,
              invoiceUrl: invEntity?.short_url || invEntity?.invoice_url || invEntity?.receipt,
              paidAt,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        } catch (e) {
          console.warn('Failed to upsert payment record:', e);
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
