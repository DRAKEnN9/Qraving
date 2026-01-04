// src/components/landing/HowItWorks.tsx
import { QrCode, Smartphone, LayoutDashboard, CreditCard, BarChart3, Zap } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: QrCode,
      title: 'Create Your Menu',
      description:
        'Build beautiful digital menus with photos, descriptions, and categories. No design skills needed.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Smartphone,
      title: 'Generate QR Codes',
      description:
        'Create unique QR codes for each table. Customers scan with their phone cameras - no app required.',
      color: 'from-red-500 to-pink-500',
    },
    {
      icon: LayoutDashboard,
      title: 'Manage Orders',
      description:
        'See orders appear instantly in your dashboard. Accept, prepare, and complete orders with one click.',
      color: 'from-orange-600 to-amber-600',
    },
    {
      icon: CreditCard,
      title: 'Accept Payments',
      description:
        'Customers pay via UPI, cards, or wallets. Integrates with Razorpay for secure transactions.',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: BarChart3,
      title: 'Analyze Performance',
      description:
        'Track sales, popular items, and peak hours. Make data-driven decisions to grow your business.',
      color: 'from-red-600 to-rose-600',
    },
    {
      icon: Zap,
      title: 'Update Instantly',
      description:
        'Change menu items, prices, or availability in seconds. Changes appear immediately on all QR menus.',
      color: 'from-orange-500 to-red-600',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-white via-orange-50/20 to-white py-24 md:scroll-mt-32"
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
              🚀 SIMPLE WORKFLOW
            </span>
          </div>
          <h2
            className="reveal-on-scroll mb-6 text-4xl font-black text-gray-900 md:text-5xl lg:text-6xl"
            data-reveal-delay="150ms"
          >
            How It Works in
            <span className="gradient-text"> 6 Simple Steps</span>
          </h2>
          <p
            className="reveal-on-scroll mx-auto max-w-3xl text-xl text-gray-600"
            data-reveal-delay="250ms"
          >
            From setup to serving customers - our platform makes restaurant management effortless
            and efficient.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-gradient-to-b from-orange-500/20 via-red-500/20 to-amber-500/20"
            data-parallax="0.04"
            data-parallax-dir="up"
          ></div>

          <div className="space-y-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;

              return (
                <div
                  key={index}
                  className={`reveal-on-scroll group relative flex items-center gap-8 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}
                  data-reveal-delay={`${100 * index}ms`}
                >
                  {/* Step Number */}
                  <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br shadow-xl">
                    <span className="text-2xl font-bold text-white">{index + 1}</span>
                  </div>

                  {/* Content Card */}
                  <div className="relative flex-1 rounded-2xl border-2 border-gray-100 bg-white p-8 shadow-lg transition-all group-hover:-translate-y-1 group-hover:shadow-2xl">
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.color} opacity-5`}
                    ></div>
                    <div className="relative mb-4 flex items-center gap-4">
                      <div className={`rounded-xl bg-gradient-to-br ${step.color} p-3 shadow-md`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
