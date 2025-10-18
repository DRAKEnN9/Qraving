import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import Payment from '@/models/Payment';
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

    // Fetch all payments for this owner account, sorted by newest first
    const payments = await Payment.find({ ownerId })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 payments
      .select('razorpayPaymentId razorpayInvoiceId amount currency status method paidAt createdAt invoiceUrl')
      .lean();

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('Fetch payments error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
