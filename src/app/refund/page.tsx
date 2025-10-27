import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Refund Policy - QR Menu Manager',
  description: 'Refund and cancellation policy for QR Menu Manager subscriptions',
};

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Overview</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                At QR Menu Manager, we strive to provide excellent service. This Refund Policy outlines our policies regarding subscription cancellations, refunds, and trial periods.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                By subscribing to our Service, you agree to this Refund Policy. Please read it carefully before making a purchase.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Free Trial Period</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">2.1 Trial Duration</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                New users are eligible for a <strong>14-day free trial</strong>. During this period, you have full access to all features without any charges.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">2.2 Trial Cancellation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can cancel your trial at any time during the 14-day period with no charges. Simply cancel through your account settings or contact our support team.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">2.3 Trial to Paid Conversion</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                After the 14-day trial ends, your subscription will automatically convert to a paid plan. You will be charged according to your selected billing cycle (monthly or annual). You will receive a reminder email before the trial ends.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">2.4 Trial Eligibility</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The free trial is available only once per user/business. You cannot create multiple accounts to receive additional free trials.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Subscription Cancellation</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">3.1 How to Cancel</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can cancel your subscription at any time by:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Logging into your account and going to Billing Settings</li>
                <li>Clicking "Cancel Subscription"</li>
                <li>Contacting our support team at support@qrmenumanager.com</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">3.2 Cancellation Effective Date</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you cancel, your subscription will remain active until the end of your current billing period. You will continue to have access to all features until that date.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">3.3 No Charges After Cancellation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Once cancelled, you will not be charged for any subsequent billing periods. Your subscription will not automatically renew.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Refund Policy</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">4.1 General Policy</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Subscription fees are generally non-refundable.</strong> Once charged, fees for the current billing period are not refunded when you cancel your subscription.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">4.2 7-Day Money-Back Guarantee</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                For first-time paid subscriptions (after trial), we offer a <strong>7-day money-back guarantee</strong>. If you are not satisfied with the Service, you may request a full refund within 7 days of your first payment.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Note:</strong> This guarantee applies only to the first payment after the trial period and not to subsequent renewals.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">4.3 Exceptional Circumstances</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may consider refund requests on a case-by-case basis for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Extended service outages or technical issues that prevented you from using the Service</li>
                <li>Duplicate or erroneous charges</li>
                <li>Billing errors</li>
                <li>Other exceptional circumstances at our discretion</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">4.4 How to Request a Refund</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To request a refund, contact our support team at:
              </p>
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                <p className="text-gray-700 mb-1">
                  <strong>Email:</strong> support@qrmenumanager.com
                </p>
                <p className="text-gray-700">
                  <strong>Subject:</strong> Refund Request - [Your Account Email]
                </p>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                Please include your account email, reason for refund request, and any relevant details. We will review and respond within 3-5 business days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Billing Cycle Changes</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">5.1 Monthly to Annual</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you switch from monthly to annual billing, you will be charged immediately for the annual plan. No refund will be provided for the remaining days of your monthly billing cycle.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">5.2 Annual to Monthly</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you switch from annual to monthly billing, the change will take effect at the end of your current annual billing period. No prorated refund is provided for unused months.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Failed Payments</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">6.1 Payment Retries</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If a payment fails, we will retry the charge up to 3 times over the next 7 days. You will receive email notifications about failed payments.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">6.2 Account Status</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If payment continues to fail, your account may be marked as "Past Due" and certain features may be restricted until payment is successful.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">6.3 Account Suspension</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                After 30 days of failed payment, your account may be suspended. Your data will be retained for 90 days, after which it may be permanently deleted.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Downgrades</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you downgrade from a higher-tier plan to a lower-tier plan, the change will take effect at the end of your current billing period. No prorated refund is provided for the remaining time in your current billing cycle.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Processing Time</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">8.1 Refund Processing</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Approved refunds will be processed within 5-7 business days. The refund will be credited to the original payment method used for the purchase.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">8.2 Bank Processing Time</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Please note that your bank or payment provider may take an additional 5-10 business days to reflect the refund in your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Chargebacks</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you initiate a chargeback with your bank or payment provider instead of contacting us directly, we reserve the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Immediately suspend or terminate your account</li>
                <li>Dispute the chargeback with documentation</li>
                <li>Charge an administrative fee to cover chargeback costs</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                We encourage you to contact us directly at support@qrmenumanager.com before initiating a chargeback so we can resolve any issues.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Taxes</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                All prices are exclusive of applicable taxes unless stated otherwise. You are responsible for any applicable taxes, including GST (Goods and Services Tax) in India. Refunds do not include any tax amounts that may have been charged.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Account Termination by Us</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">11.1 Violation of Terms</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If we terminate your account due to violation of our Terms of Service, no refund will be provided for the remaining subscription period.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">11.2 Service Discontinuation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If we discontinue the Service entirely, we will provide prorated refunds for any unused subscription time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this Refund Policy from time to time. We will notify you of significant changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Refund Policy, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> support@qrmenumanager.com
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Phone:</strong> +91 123 456 7890
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Business Hours:</strong> Monday - Saturday, 10:00 AM - 6:00 PM IST
                </p>
                <p className="text-gray-700">
                  <strong>Response Time:</strong> We typically respond within 24 hours on business days
                </p>
              </div>
            </section>

            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mt-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Quick Summary</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li>✅ <strong>14-day free trial</strong> - Cancel anytime with no charges</li>
                <li>✅ <strong>7-day money-back guarantee</strong> - For first-time paid subscriptions</li>
                <li>✅ <strong>Cancel anytime</strong> - Access until end of billing period</li>
                <li>❌ <strong>No refunds</strong> - For subscription renewals (except exceptional cases)</li>
                <li>📧 <strong>Contact us</strong> - We're here to help resolve any issues</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
