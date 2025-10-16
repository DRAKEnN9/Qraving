import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-gradient-to-b from-white via-red-50/20 to-white py-24 scroll-mt-24 md:scroll-mt-32"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        ></div>
      </div>

      <div className="container relative mx-auto px-4">
        <div className="mb-20 text-center">
          <div className="mb-4 inline-block reveal-on-scroll" data-reveal-delay="100ms">
            <span className="rounded-full bg-gradient-to-r from-orange-100 to-red-100 px-6 py-2 text-sm font-bold text-orange-700">
              💰 SIMPLE PRICING
            </span>
          </div>
          <h2
            className="reveal-on-scroll mb-6 text-4xl font-black text-gray-900 md:text-5xl lg:text-6xl"
            data-reveal-delay="150ms"
          >
            Transparent Pricing,
            <span className="gradient-text"> No Hidden Fees</span>
          </h2>
          <p
            className="reveal-on-scroll mx-auto max-w-3xl text-xl text-gray-600"
            data-reveal-delay="250ms"
          >
            Choose the perfect plan for your restaurant. Start with a 14-day free trial - no credit
            card required.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
          {/* Basic Plan */}
          <div
            className="reveal-on-scroll group rounded-3xl border-2 border-orange-200 bg-white p-10 shadow-xl transition-all hover:-translate-y-2 hover:border-orange-400 hover:shadow-2xl"
            data-reveal-delay="300ms"
          >
            <div className="mb-6">
              <h3 className="text-3xl font-black text-gray-900">Basic</h3>
              <p className="mt-2 text-lg text-gray-600">Perfect for single restaurant</p>
            </div>
            <div className="mb-8">
              <span className="text-6xl font-black text-gray-900">₹1,499</span>
              <span className="ml-2 text-xl text-gray-600">/ month</span>
            </div>
            <ul className="mb-10 space-y-4">
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-orange-500" />
                <span className="text-lg text-gray-700">QR Menu for 1 Restaurant</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-orange-500" />
                <span className="text-lg text-gray-700">Drag & drop menu builder</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-orange-500" />
                <span className="text-lg text-gray-700">Order management dashboard</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-orange-500" />
                <span className="text-lg text-gray-700">Email notifications</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-orange-500" />
                <span className="text-lg text-gray-700">UPI payment integration</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-orange-500" />
                <span className="text-lg text-gray-700">Basic support (Email)</span>
              </li>
            </ul>
            <Link
              href="/signup?plan=basic"
              className="block w-full rounded-full border-2 border-orange-600 bg-white px-6 py-4 text-center text-lg font-bold text-orange-600 transition-all hover:scale-105 hover:bg-orange-50"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Advance Plan */}
          <div
            className="reveal-on-scroll group relative rounded-3xl border-2 border-transparent bg-gradient-to-br from-orange-500 to-red-600 p-10 shadow-2xl transition-all hover:-translate-y-2 hover:shadow-orange-500/50"
            data-reveal-delay="400ms"
          >
            {/* Recommended Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
              <span className="flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-2 text-sm font-black text-gray-900 shadow-xl">
                <Sparkles className="h-4 w-4" />
                MOST POPULAR
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-3xl font-black text-white">Advance</h3>
              <p className="mt-2 text-lg text-orange-100">For growing restaurants</p>
            </div>
            <div className="mb-8">
              <span className="text-6xl font-black text-white">₹1,999</span>
              <span className="ml-2 text-xl text-orange-100">/ month</span>
            </div>
            <ul className="mb-10 space-y-4">
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-white" />
                <span className="text-lg font-bold text-white">Everything in Basic</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-white" />
                <span className="text-lg text-orange-50">1 Restaurant</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-white" />
                <span className="text-lg text-orange-50">Analytics & Reports</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-white" />
                <span className="text-lg text-orange-50">Peak time reports</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-white" />
                <span className="text-lg text-orange-50">Popular items tracking</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-white" />
                <span className="text-lg text-orange-50">Exportable CSV reports</span>
              </li>
              <li className="flex items-start">
                <Check className="mr-3 h-6 w-6 flex-shrink-0 text-white" />
                <span className="text-lg font-bold text-white">Priority support (Chat)</span>
              </li>
            </ul>
            <Link
              href="/signup?plan=advance"
              className="block w-full rounded-full bg-white px-6 py-4 text-center text-lg font-black text-orange-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            >
              Start 14-Day Free Trial
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="reveal-on-scroll mx-auto mt-24 max-w-4xl" data-reveal-delay="500ms">
          <h3 className="mb-12 text-center text-3xl font-black text-gray-900">
            Frequently Asked Questions
          </h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="group rounded-2xl border-2 border-orange-100 bg-white p-8 shadow-lg transition-all hover:border-orange-300 hover:shadow-xl">
              <h4 className="mb-3 text-xl font-bold text-gray-900">
                What happens after the 14-day trial?
              </h4>
              <p className="leading-relaxed text-gray-600">
                After 14 days, you&apos;ll be charged based on your selected plan. You can cancel
                anytime before the trial ends with no charges.
              </p>
            </div>
            <div className="group rounded-2xl border-2 border-orange-100 bg-white p-8 shadow-lg transition-all hover:border-orange-300 hover:shadow-xl">
              <h4 className="mb-3 text-xl font-bold text-gray-900">Can I change plans later?</h4>
              <p className="leading-relaxed text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                immediately.
              </p>
            </div>
            <div className="group rounded-2xl border-2 border-orange-100 bg-white p-8 shadow-lg transition-all hover:border-orange-300 hover:shadow-xl">
              <h4 className="mb-3 text-xl font-bold text-gray-900">
                How does UPI payment settlement work?
              </h4>
              <p className="leading-relaxed text-gray-600">
                UPI payments go directly to your registered UPI ID. We don&apos;t hold your money -
                customers pay you directly with zero platform fees.
              </p>
            </div>
            <div className="group rounded-2xl border-2 border-orange-100 bg-white p-8 shadow-lg transition-all hover:border-orange-300 hover:shadow-xl">
              <h4 className="mb-3 text-xl font-bold text-gray-900">Do you offer refunds?</h4>
              <p className="leading-relaxed text-gray-600">
                We offer a 30-day money-back guarantee. If you&apos;re not satisfied within the
                first month, we&apos;ll refund your payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
