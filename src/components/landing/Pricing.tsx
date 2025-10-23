'use client';
import Link from 'next/link';
import { Check, Sparkles, Star, Shield, Zap, Users, BarChart3 } from 'lucide-react';
import { useState } from 'react';

export default function Pricing() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const isYearly = interval === 'yearly';
  const basicPrice = isYearly ? 14999 : 1499;
  const advancePrice = isYearly ? 19999 : 1999;

  const features = {
    basic: [
      'QR Menu for 1 Restaurant',
      'Drag & drop menu builder',
      'Order management dashboard',
      'Real-time order notifications',
      'UPI payment integration',
      'Basic analytics & insights',
      'Email & chat support',
    ],
    advance: [
      'Everything in Basic',
      'Advanced analytics & reports',
      'Peak time optimization',
      'Popular items tracking',
      'Exportable CSV reports',
      'Customer feedback system',
      'Priority support (24/7)',
      'Custom branding options',
      'Multi-language support',
    ],
  };

  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-orange-50/30 py-24 md:scroll-mt-32"
    >
      {/* Enhanced Background */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, #f97316 2px, transparent 2px),
              radial-gradient(circle at 75% 75%, #f97316 2px, transparent 2px)
            `,
            backgroundSize: '60px 60px',
          }}
        ></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute left-10 top-10 opacity-10">
        <BarChart3 className="h-20 w-20 text-orange-500" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-10">
        <Users className="h-20 w-20 text-orange-500" />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 px-6 py-3">
            <Star className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-semibold uppercase tracking-wide text-orange-700">
              Transparent Pricing
            </span>
          </div>

          <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl lg:text-6xl">
            Simple, Fair
            <span className="block bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text pb-2 text-transparent">
              Pricing
            </span>
          </h2>

          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-600">
            Start with a 14-day free trial. No credit card required.
            <span className="mt-2 block text-lg text-gray-500">
              Trusted by 500+ restaurants across India
            </span>
          </p>

          {/* Enhanced Toggle */}
          <div className="mt-12 flex items-center justify-center">
            <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-100 p-2">
              <button
                onClick={() => setInterval('monthly')}
                className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                  !isYearly
                    ? 'bg-white text-orange-600 shadow-lg shadow-orange-500/10'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setInterval('yearly')}
                className={`flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                  isYearly
                    ? 'bg-white text-orange-600 shadow-lg shadow-orange-500/10'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                  Save 16%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards - Same Height */}
        <div className="mx-auto grid max-w-6xl items-stretch gap-8 lg:grid-cols-2 xl:gap-12">
          {/* Basic Plan - No Hover Effects */}
          <div className="flex flex-col">
            <div className="flex flex-1 flex-col rounded-3xl border border-gray-100 bg-white p-8  shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/25">
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">Essential</h3>
                  <div className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1">
                    <Users className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700">Startup</span>
                  </div>
                </div>
                <p className="text-gray-600">Perfect for single restaurant operations</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900">
                    ₹{basicPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-gray-500">/{isYearly ? 'year' : 'month'}</span>
                </div>
                {isYearly && (
                  <p className="mt-2 text-sm font-semibold text-green-600">
                    Equivalent to ₹1,250/month
                  </p>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-4">
                {features.basic.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/signup?plan=basic&interval=${interval}`}
                className="rounded-2xl bg-gray-900 px-6 py-4 text-center font-semibold text-white transition-colors duration-300 hover:bg-gray-800"
              >
                Start Free Trial
              </Link>
            </div>
          </div>

          {/* Advance Plan - With Hover Effects */}
          <div className="flex flex-col">
            <div className="group relative flex flex-1 flex-col rounded-3xl border border-orange-400 bg-gradient-to-br from-orange-500 to-red-600 p-8 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/25">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-2 rounded-full border border-orange-200 bg-white px-6 py-2 shadow-xl">
                  <Sparkles className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-bold text-gray-900">MOST POPULAR</span>
                </div>
              </div>

              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Professional</h3>
                  <div className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                    <Zap className="h-3 w-3 text-white" />
                    <span className="text-xs font-semibold text-white">Growing</span>
                  </div>
                </div>
                <p className="text-orange-100">For growing restaurants with advanced needs</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">
                    ₹{advancePrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-orange-100">/{isYearly ? 'year' : 'month'}</span>
                </div>
                {isYearly && (
                  <p className="mt-2 text-sm font-semibold text-orange-100">
                    Equivalent to ₹1,667/month
                  </p>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-4">
                {features.advance.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mr-3 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span
                      className={`${feature.includes('Everything in Basic') ? 'font-semibold text-white' : 'text-orange-50'}`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/signup?plan=advance&interval=${interval}`}
                className="rounded-2xl bg-white px-6 py-4 text-center font-bold text-orange-600 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>

        {/* Enhanced FAQ */}
        <div className="mx-auto mt-20 max-w-4xl">
          <div className="mb-12 text-center">
            <h3 className="mb-4 text-3xl font-bold text-gray-900">Frequently Asked Questions</h3>
            <p className="mx-auto max-w-2xl text-gray-600">
              Get answers to common questions about our pricing and services
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                question: 'What happens after the 14-day trial?',
                answer:
                  "After 14 days, you'll be automatically moved to your selected paid plan. You can cancel anytime before the trial ends with no charges.",
              },
              {
                question: 'Can I change plans later?',
                answer:
                  'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing.',
              },
              {
                question: 'How does UPI payment settlement work?',
                answer:
                  "UPI payments go directly to your registered UPI ID. We don't hold your money - customers pay you directly with zero platform fees.",
              },
              {
                question: 'Do you offer refunds?',
                answer:
                  "We offer a 30-day money-back guarantee. If you're not satisfied within the first month, we'll refund your payment, no questions asked.",
              },
              {
                question: 'Is there a setup fee?',
                answer:
                  'No setup fees. You only pay the monthly or yearly subscription cost. Everything else is included.',
              },
              {
                question: 'Can I use multiple restaurants?',
                answer:
                  'The Essential plan supports 1 restaurant. For multiple locations, contact us for enterprise pricing.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-colors duration-300 hover:border-orange-200"
              >
                <h4 className="mb-3 text-lg font-semibold text-gray-900">{faq.question}</h4>
                <p className="leading-relaxed text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="rounded-3xl bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white">
              <h4 className="mb-4 text-2xl font-bold">Still have questions?</h4>
              <p className="mx-auto mb-6 max-w-2xl text-gray-300">
                Our team is here to help you choose the right plan for your restaurant.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/contact"
                  className="rounded-2xl bg-white px-8 py-3 font-semibold text-gray-900 transition-all hover:scale-105 hover:shadow-lg"
                >
                  Contact Sales
                </Link>
                <Link
                  href="/demo"
                  className="rounded-2xl border border-white px-8 py-3 font-semibold text-white transition-all hover:bg-white hover:text-gray-900"
                >
                  Book a Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
