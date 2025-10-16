// UPI Payment Utility Functions
// Works with ALL UPI apps: GPay, PhonePe, Paytm, BHIM, etc.
// NO API KEY NEEDED - Uses standard UPI deep links

export interface UPIPaymentParams {
  upiId: string;           // Restaurant's UPI ID (e.g., restaurant@paytm)
  payeeName: string;       // Restaurant name
  amount: number;          // Amount in rupees (e.g., 500.00)
  transactionNote: string; // Order description
  transactionRef: string;  // Unique order reference
}

/**
 * Generate UPI payment link
 * Opens any UPI app on customer's phone
 * Works on mobile and desktop (via QR code)
 */
export function generateUPILink(params: UPIPaymentParams): string {
  // IMPORTANT: Do not encode '@' in UPI ID (pa). Some apps (PhonePe) reject encoded '@'.
  const pa = params.upiId; // raw
  const pn = encodeURIComponent(params.payeeName || '');
  const am = params.amount.toFixed(2);
  const cu = 'INR';
  // Remove '#' from note to avoid quirks in some apps, then encode
  const tn = encodeURIComponent((params.transactionNote || '').replace(/#/g, ''));
  // Keep tr plain text (order id/ref). If it can include special chars, encode it.
  const tr = params.transactionRef;

  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}&tr=${tr}`;
}

/**
 * Generate UPI QR Code data
 * Use with QR code library (e.g., qrcode, react-qr-code)
 */
export function generateUPIQRData(params: UPIPaymentParams): string {
  return generateUPILink(params);
}

/**
 * Validate UPI ID format
 * Examples: restaurant@paytm, user@ybl, merchant@okaxis
 */
export function isValidUPIId(upiId: string): boolean {
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upiId);
}

/**
 * Format amount from paise to rupees
 */
export function formatUPIAmount(amountInPaise: number): number {
  return amountInPaise / 100;
}

/**
 * Check if device supports UPI payment
 * (Mobile devices with UPI apps)
 */
export function isUPISupported(): boolean {
  // UPI works on mobile devices
  // On desktop, show QR code instead
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
