import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import dbConnect from '@/lib/mongodb';
import Restaurant from '@/models/Restaurant';
import { createOrderSchema } from '@/lib/validation';

// Initialize Razorpay
let razorpay: Razorpay | null = null;
try {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay credentials not configured');
  } else {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (error) {
  console.error('Failed to initialize Razorpay:', error);
}

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest) {
  // Order payments are disabled for food ordering
  return NextResponse.json(
    { error: 'Online payments for orders are disabled' },
    { status: 410 }
  );
}
