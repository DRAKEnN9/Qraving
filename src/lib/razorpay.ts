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
  basic: {
    monthly: process.env.RAZORPAY_PLAN_BASIC_MONTHLY || '',
    yearly: process.env.RAZORPAY_PLAN_BASIC_YEARLY || '',
  },
  advance: {
    monthly: process.env.RAZORPAY_PLAN_ADVANCE_MONTHLY || '',
    yearly: process.env.RAZORPAY_PLAN_ADVANCE_YEARLY || '',
  },
} as const;

export function assertPlansConfigured() {
  const missing: string[] = [];
  if (!RAZORPAY_PLANS.basic.monthly) missing.push('RAZORPAY_PLAN_BASIC_MONTHLY');
  if (!RAZORPAY_PLANS.basic.yearly) missing.push('RAZORPAY_PLAN_BASIC_YEARLY');
  if (!RAZORPAY_PLANS.advance.monthly) missing.push('RAZORPAY_PLAN_ADVANCE_MONTHLY');
  if (!RAZORPAY_PLANS.advance.yearly) missing.push('RAZORPAY_PLAN_ADVANCE_YEARLY');
  if (missing.length) {
    throw new Error('Razorpay plan IDs are not configured. Missing: ' + missing.join(', '));
  }
}
