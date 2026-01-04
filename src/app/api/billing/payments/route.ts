import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import Payment from '@/models/Payment';
import Subscription from '@/models/Subscription';
import { getRazorpay } from '@/lib/razorpay';
import { resolveAccountOwnerPrivilege } from '@/lib/ownership';

// GET payment history (invoices)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    const limitParam = url.searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 200);

    if (forceRefresh) {
      try {
        const sub = await Subscription.findOne({ ownerId })
          .select('_id razorpaySubscriptionId')
          .lean();
        if (sub?.razorpaySubscriptionId) {
          const rz: any = getRazorpay();

          const invoicesResp: any = await rz.invoices.all({
            subscription_id: sub.razorpaySubscriptionId,
            count: limit,
          });

          const invoices: any[] = Array.isArray(invoicesResp?.items)
            ? invoicesResp.items
            : Array.isArray(invoicesResp)
              ? invoicesResp
              : [];

          for (const inv of invoices) {
            if (!inv || !inv.id) continue;

            const invoiceId = String(inv.id);
            const paymentId = inv.payment_id ? String(inv.payment_id) : undefined;
            const currency = inv.currency ? String(inv.currency) : 'INR';

            const status: any =
              inv.status === 'paid' ? 'captured' : inv.status === 'expired' ? 'failed' : 'created';
            const amount =
              typeof inv.amount_paid === 'number'
                ? inv.amount_paid
                : typeof inv.amount === 'number'
                  ? inv.amount
                  : 0;

            const invoiceUrl = inv.short_url || inv.invoice_url || inv.receipt || undefined;
            const paidAt =
              typeof inv.paid_at === 'number' ? new Date(inv.paid_at * 1000) : undefined;

            const existing = await Payment.findOne({
              $or: [
                { razorpayInvoiceId: invoiceId },
                ...(paymentId ? [{ razorpayPaymentId: paymentId }] : []),
              ],
            })
              .select('status invoiceUrl paidAt amount currency')
              .lean();

            const statusRank: Record<string, number> = {
              created: 1,
              failed: 2,
              authorized: 3,
              captured: 4,
              refunded: 5,
            };

            const existingStatus = (existing as any)?.status;
            const mergedStatus =
              existingStatus && (statusRank[existingStatus] || 0) > (statusRank[status] || 0)
                ? existingStatus
                : status;

            const mergedInvoiceUrl = (existing as any)?.invoiceUrl || invoiceUrl;
            const mergedPaidAt = (existing as any)?.paidAt || paidAt;
            const existingAmount =
              typeof (existing as any)?.amount === 'number' ? (existing as any).amount : 0;
            const mergedAmount = existingAmount > 0 ? existingAmount : amount;
            const mergedCurrency = (existing as any)?.currency || currency;

            const filter = existing
              ? { _id: existing._id }
              : paymentId
                ? { razorpayPaymentId: paymentId }
                : { razorpayInvoiceId: invoiceId };

            await Payment.findOneAndUpdate(
              filter as any,
              {
                ownerId,
                subscriptionId: sub._id,
                razorpayPaymentId: paymentId,
                razorpayInvoiceId: invoiceId,
                amount: mergedAmount,
                currency: mergedCurrency,
                status: mergedStatus,
                invoiceUrl: mergedInvoiceUrl,
                paidAt: mergedPaidAt,
              },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }
        }
      } catch (e) {
        console.warn('Payment refresh from Razorpay failed:', e);
      }
    }

    const payments = await Payment.find({ ownerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        'razorpayPaymentId razorpayInvoiceId amount currency status method paidAt createdAt invoiceUrl'
      )
      .lean();

    const seen = new Set<string>();
    const deduped = (payments || []).filter((p: any) => {
      const key = p.razorpayPaymentId || p.razorpayInvoiceId || String(p._id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ payments: deduped });
  } catch (error: any) {
    console.error('Fetch payments error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
