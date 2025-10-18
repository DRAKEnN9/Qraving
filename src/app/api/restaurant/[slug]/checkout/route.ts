import { NextRequest, NextResponse } from 'next/server';

// This endpoint is deprecated. Order checkout now uses Razorpay or UPI deep links.
// Please use `/api/checkout/razorpay` for gateway-based orders.

// POST create checkout session
export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Stripe checkout is deprecated. Use /api/checkout/razorpay or UPI deep link flow.',
    },
    { status: 410 }
  );
}
