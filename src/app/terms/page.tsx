import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service - QR Menu Manager',
  description: 'Terms and conditions for using QR Menu Manager services',
};

export default function TermsOfService() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing and using QR Menu Manager ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                QR Menu Manager provides a digital menu and contactless ordering platform for restaurants and food service businesses. The Service includes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Digital menu management and QR code generation</li>
                <li>Online ordering system with UPI payment integration</li>
                <li>Real-time order management and notifications</li>
                <li>Analytics and reporting tools</li>
                <li>Customer management features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">3.1 Registration</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To use our Service, you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials.
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">3.2 Account Security</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You are responsible for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Subscription and Payment</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">4.1 Free Trial</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We offer a 14-day free trial for new users. After the trial period ends, your subscription will automatically convert to a paid plan unless cancelled.
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">4.2 Billing</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Subscription fees are billed in advance on a monthly or annual basis. Payment is processed through Razorpay. You authorize us to charge your payment method for all subscription fees.
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">4.3 Automatic Renewal</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your subscription will automatically renew at the end of each billing period unless you cancel before the renewal date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Transmit any malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use the Service to send spam or unsolicited communications</li>
                <li>Resell or redistribute the Service without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service and its original content, features, and functionality are owned by QR Menu Manager and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">6.1 Your Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You retain ownership of any content you upload to the Service (menu items, images, descriptions). By uploading content, you grant us a license to use, display, and distribute your content as necessary to provide the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data and Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your use of the Service is also governed by our Privacy Policy. We collect and use information in accordance with applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Service Availability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We strive to maintain 99.9% uptime but do not guarantee uninterrupted access to the Service. We may perform maintenance, updates, or modifications that temporarily affect service availability.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">9.1 By You</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may cancel your subscription at any time through your account settings or by contacting support. Cancellation will take effect at the end of the current billing period.
              </p>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">9.2 By Us</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may suspend or terminate your account if you violate these Terms of Service or engage in fraudulent activity.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Disclaimers</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, QR MENU MANAGER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to indemnify and hold harmless QR Menu Manager from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. We will notify you of significant changes via email or through the Service. Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> support@qrmenumanager.com
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Phone:</strong> +91 123 456 7890
                </p>
                <p className="text-gray-700">
                  <strong>Address:</strong> Mumbai, Maharashtra, India
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
