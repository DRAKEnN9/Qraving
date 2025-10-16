// src/components/landing/Features.tsx
import { QrCode, ShoppingCart, BarChart3, Zap, Shield, Smartphone } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: QrCode,
      title: 'Smart QR Menus',
      description:
        'Generate beautiful QR codes for each table. Customers scan and instantly access your full menu with photos and descriptions.',
      color: 'from-orange-500 to-red-500',
      gradient: 'from-orange-50 to-red-50',
    },
    {
      icon: ShoppingCart,
      title: 'Instant Orders & Payments',
      description:
        'Accept orders with UPI & Razorpay integration. Orders flow directly to your dashboard with real-time notifications.',
      color: 'from-red-500 to-pink-500',
      gradient: 'from-red-50 to-pink-50',
    },
    {
      icon: BarChart3,
      title: 'Revenue Analytics',
      description:
        'Track daily revenue, peak hours, and bestselling items. Get insights that help you grow your business.',
      color: 'from-orange-600 to-amber-600',
      gradient: 'from-orange-50 to-amber-50',
    },
    {
      icon: Zap,
      title: 'Lightning Fast Updates',
      description:
        'Update prices, availability, or add new items in seconds. Changes reflect instantly on all QR menus.',
      color: 'from-yellow-500 to-orange-500',
      gradient: 'from-yellow-50 to-orange-50',
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description:
        "Bank-grade security for all transactions. Your data and your customers' information stay protected.",
      color: 'from-red-600 to-rose-600',
      gradient: 'from-red-50 to-rose-50',
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Design',
      description:
        'Perfect experience on any device. Customers browse menus easily on phones, tablets, or desktop.',
      color: 'from-orange-500 to-red-600',
      gradient: 'from-orange-50 to-red-50',
    },
  ];

  return (
    <section
      id="features"
      className="relative bg-gradient-to-b from-white via-orange-50/30 to-white py-24 scroll-mt-24 md:scroll-mt-32"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5" data-parallax="0.08" data-parallax-dir="up">
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
          <div className="reveal-on-scroll mb-4 inline-block" data-reveal-delay="100ms">
            <span className="rounded-full bg-gradient-to-r from-orange-100 to-red-100 px-6 py-2 text-sm font-bold text-orange-700">
              ✨ POWERFUL FEATURES
            </span>
          </div>
          <h2
            className="reveal-on-scroll mb-6 text-4xl font-black text-gray-900 md:text-5xl lg:text-6xl"
            data-reveal-delay="150ms"
          >
            Everything You Need to
            <span className="gradient-text"> Grow Your Restaurant</span>
          </h2>
          <p
            className="reveal-on-scroll mx-auto max-w-3xl text-xl text-gray-600"
            data-reveal-delay="250ms"
          >
            From digital menus to payment processing and analytics - we've got you covered with all
            the tools you need.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="reveal-on-scroll group rounded-3xl border-2 border-gray-100 bg-white p-8 shadow-lg transition-all hover:-translate-y-2 hover:border-orange-200 hover:shadow-2xl"
                data-reveal-delay={`${100 * index}ms`}
              >
                <div className="relative mb-6">
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-50 blur-xl transition-opacity group-hover:opacity-100`}
                  ></div>
                  <div
                    className={`relative inline-flex rounded-2xl bg-gradient-to-br ${feature.color} p-5 shadow-xl transition-transform group-hover:scale-110`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="mb-4 text-2xl font-bold text-gray-900 transition-colors group-hover:text-orange-600">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="reveal-on-scroll mt-20 text-center" data-reveal-delay="600ms">
          <p className="mb-6 text-xl font-semibold text-gray-700">
            Ready to transform your restaurant?
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-8 py-4 text-lg font-bold text-white shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            Start Your Free Trial
            <span className="text-2xl">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
