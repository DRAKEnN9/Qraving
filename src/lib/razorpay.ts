import Razorpay from 'razorpay';

let instance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (instance) return instance;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  }

  instance = new Razorpay({ key_id, key_secret });
  return instance;
}

export const RAZORPAY_PLANS = {
  basic: process.env.RAZORPAY_PLAN_BASIC || '',
  advance: process.env.RAZORPAY_PLAN_ADVANCE || '',
};

export function assertPlansConfigured() {
  if (!RAZORPAY_PLANS.basic || !RAZORPAY_PLANS.advance) {
    throw new Error('Razorpay plan IDs are not configured. Set RAZORPAY_PLAN_BASIC and RAZORPAY_PLAN_ADVANCE');
  }
}
