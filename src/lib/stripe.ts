// Deprecated: Stripe has been removed from this project.
// Use Razorpay flows instead (see src/lib/razorpay.ts).

export function deprecatedStripe(): never {
  throw new Error('Stripe is deprecated. Use Razorpay (src/lib/razorpay.ts).');
}
