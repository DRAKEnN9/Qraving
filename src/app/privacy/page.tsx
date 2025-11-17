import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - QR Menu Manager',
  description: 'Privacy policy and data protection information for QR Menu Manager',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-orange-600 transition-colors hover:text-orange-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="rounded-2xl bg-white p-8 shadow-lg md:p-12">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mb-8 text-gray-600">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">1. Introduction</h2>
              <p className="mb-4 leading-relaxed text-gray-700">
                QR Menu Manager ("we", "our", or "us") is committed to protecting your privacy. This
                Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our Service.
              </p>
              <p className="mb-4 leading-relaxed text-gray-700">
                Please read this privacy policy carefully. If you do not agree with the terms of
                this privacy policy, please do not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">2. Information We Collect</h2>

              <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-800">
                2.1 Personal Information
              </h3>
              <p className="mb-4 leading-relaxed text-gray-700">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  <strong>Account Information:</strong> Name, email address, phone number, business
                  name, and password
                </li>
                <li>
                  <strong>Business Information:</strong> Restaurant details, address, menu items,
                  images, and pricing
                </li>
                <li>
                  <strong>Payment Information:</strong> Payment method details processed securely
                  through Razorpay
                </li>
                <li>
                  <strong>Communications:</strong> Messages, support requests, and feedback you send
                  to us
                </li>
              </ul>

              <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-800">2.2 Customer Data</h3>
              <p className="mb-4 leading-relaxed text-gray-700">
                When your customers place orders through your QR menu, we collect:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>Customer name and contact information</li>
                <li>Table number and order details</li>
                <li>Payment information (processed by Razorpay)</li>
                <li>Order timestamps and status</li>
              </ul>

              <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-800">
                2.3 Automatically Collected Information
              </h3>
              <p className="mb-4 leading-relaxed text-gray-700">
                We automatically collect certain information when you use our Service:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  <strong>Device Information:</strong> IP address, browser type, operating system,
                  device identifiers
                </li>
                <li>
                  <strong>Usage Data:</strong> Pages visited, features used, time spent on pages,
                  click data
                </li>
                <li>
                  <strong>Analytics Data:</strong> Order statistics, popular menu items, peak
                  ordering times
                </li>
                <li>
                  <strong>Cookies:</strong> Session identifiers and preference data
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                3. How We Use Your Information
              </h2>
              <p className="mb-4 leading-relaxed text-gray-700">
                We use the information we collect to:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process your transactions and manage your subscription</li>
                <li>Send you order notifications and updates</li>
                <li>Provide customer support and respond to your requests</li>
                <li>Send you technical notices, updates, and security alerts</li>
                <li>Communicate with you about products, services, and promotional offers</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Detect, prevent, and address technical issues and fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                4. How We Share Your Information
              </h2>

              <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-800">
                4.1 Service Providers
              </h3>
              <p className="mb-4 leading-relaxed text-gray-700">
                We share information with third-party service providers who perform services on our
                behalf:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>
                  <strong>Razorpay:</strong> Payment processing and subscription management
                </li>
                <li>
                  <strong>Firebase:</strong> Authentication and database services
                </li>
                <li>
                  <strong>Cloud Hosting:</strong> Data storage and application hosting
                </li>
                <li>
                  <strong>Analytics Services:</strong> Usage analytics and performance monitoring
                </li>
              </ul>

              <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-800">
                4.2 Business Transfers
              </h3>
              <p className="mb-4 leading-relaxed text-gray-700">
                If we are involved in a merger, acquisition, or sale of assets, your information may
                be transferred as part of that transaction.
              </p>

              <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-800">
                4.3 Legal Requirements
              </h3>
              <p className="mb-4 leading-relaxed text-gray-700">
                We may disclose your information if required by law or in response to valid requests
                by public authorities.
              </p>

              <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-800">
                4.4 With Your Consent
              </h3>
              <p className="mb-4 leading-relaxed text-gray-700">
                We may share your information with third parties when you give us explicit consent
                to do so.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">5. Data Security</h2>
              <p className="mb-4 leading-relaxed text-gray-700">
                We implement appropriate technical and organizational measures to protect your
                information:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication using Firebase Auth</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authorization mechanisms</li>
                <li>PCI-compliant payment processing through Razorpay</li>
              </ul>
              <p className="mb-4 leading-relaxed text-gray-700">
                However, no method of transmission over the Internet or electronic storage is 100%
                secure. While we strive to protect your information, we cannot guarantee absolute
                security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">6. Data Retention</h2>
              <p className="mb-4 leading-relaxed text-gray-700">
                We retain your information for as long as necessary to:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>Provide you with our Service</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce our agreements</li>
              </ul>
              <p className="mb-4 leading-relaxed text-gray-700">
                When you close your account, we will delete or anonymize your personal information
                within 90 days, except where we are required to retain it for legal or regulatory
                purposes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">7. Your Rights and Choices</h2>

              <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-800">
                7.1 Access and Update
              </h3>
              <p className="mb-4 leading-relaxed text-gray-700">
                You can access and update your account information at any time through your account
                settings.
              </p>

              <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-800">
                7.2 Data Portability
              </h3>
              <p className="mb-4 leading-relaxed text-gray-700">
                You can request a copy of your data in a machine-readable format by contacting us.
              </p>

              <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-800">7.3 Deletion</h3>
              <p className="mb-4 leading-relaxed text-gray-700">
                You can request deletion of your account and personal information by contacting
                support. Note that some information may be retained for legal or legitimate business
                purposes.
              </p>

              <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-800">
                7.4 Marketing Communications
              </h3>
              <p className="mb-4 leading-relaxed text-gray-700">
                You can opt out of marketing emails by clicking the "unsubscribe" link in any
                marketing email or by updating your account preferences.
              </p>

              <h3 className="mb-3 mt-4 text-xl font-semibold text-gray-800">7.5 Cookies</h3>
              <p className="mb-4 leading-relaxed text-gray-700">
                You can control cookies through your browser settings. Note that disabling cookies
                may affect the functionality of our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">8. Children's Privacy</h2>
              <p className="mb-4 leading-relaxed text-gray-700">
                Our Service is not intended for children under 18 years of age. We do not knowingly
                collect personal information from children. If you become aware that a child has
                provided us with personal information, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                9. International Data Transfers
              </h2>
              <p className="mb-4 leading-relaxed text-gray-700">
                Your information may be transferred to and processed in countries other than your
                country of residence. We ensure appropriate safeguards are in place to protect your
                information in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">10. Third-Party Links</h2>
              <p className="mb-4 leading-relaxed text-gray-700">
                Our Service may contain links to third-party websites. We are not responsible for
                the privacy practices of these websites. We encourage you to read their privacy
                policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                11. Changes to This Privacy Policy
              </h2>
              <p className="mb-4 leading-relaxed text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of
                significant changes by email or through a prominent notice on our Service. Your
                continued use of the Service after changes constitutes acceptance of the updated
                policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">12. Contact Us</h2>
              <p className="mb-4 leading-relaxed text-gray-700">
                If you have any questions about this Privacy Policy or our data practices, please
                contact us at:
              </p>
              <div className="rounded-lg bg-gray-50 p-6">
                <p className="mb-2 text-gray-700">
                  <strong>Email:</strong> adityadiwakar202@gmail.com
                </p>
                <p className="mb-2 text-gray-700">
                  <strong>Support:</strong> adityadiwakar202@gmail.com
                </p>
                <p className="mb-2 text-gray-700">
                  <strong>Phone:</strong> +91 9179842239
                </p>
                <p className="text-gray-700">
                  <strong>Address:</strong> Gwalior, Madhya Pradesh, India
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">13. Compliance</h2>
              <p className="mb-4 leading-relaxed text-gray-700">
                We are committed to complying with applicable data protection laws, including:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>Information Technology Act, 2000 (India)</li>
                <li>
                  Information Technology (Reasonable Security Practices and Procedures and Sensitive
                  Personal Data or Information) Rules, 2011
                </li>
                <li>General Data Protection Regulation (GDPR) for EU users</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
