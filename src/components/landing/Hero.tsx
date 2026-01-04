import Link from 'next/link';
import { ArrowRight, Sparkles, Star } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070')",
          }}
          data-parallax="0.15"
        ></div>
        {/* Gradient Overlays */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-orange-900/60"
          data-parallax="0.08"
          data-parallax-dir="up"
        ></div>
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"
          data-parallax="0.05"
          data-parallax-dir="up"
        ></div>
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        <div
          className="animate-float absolute left-1/4 top-20 h-2 w-2 rounded-full bg-orange-400 opacity-60"
          data-parallax="0.25"
        ></div>
        <div
          className="animate-float absolute right-1/3 top-32 h-3 w-3 rounded-full bg-red-400 opacity-40"
          style={{ animationDelay: '1s' }}
          data-parallax="0.22"
        ></div>
        <div
          className="animate-float absolute left-1/2 top-40 h-2 w-2 rounded-full bg-yellow-400 opacity-50"
          style={{ animationDelay: '2s' }}
          data-parallax="0.18"
        ></div>
        <div
          className="animate-float absolute bottom-40 right-1/4 h-3 w-3 rounded-full bg-orange-300 opacity-60"
          style={{ animationDelay: '0.5s' }}
          data-parallax="0.2"
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-20 flex min-h-screen items-center pt-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            {/* Badge */}
            <div
              className="reveal-on-scroll mb-8 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-5 py-2.5 text-white shadow-xl backdrop-blur-md"
              data-reveal-delay="100ms"
            >
              <Sparkles className="h-5 w-5 text-orange-400" />
              <span className="text-sm font-bold">Turn Every Table Into Revenue</span>
            </div>

            {/* Heading */}
            <h1
              className="reveal-on-scroll mb-6 text-5xl font-black leading-[1.1] text-white md:text-6xl lg:text-7xl xl:text-8xl"
              data-reveal-delay="150ms"
            >
              Modern QR Menus
              <br />
              <span className="gradient-text drop-shadow-2xl">For Modern Restaurants</span>
            </h1>

            {/* Description */}
            <p
              className="reveal-on-scroll mb-10 max-w-3xl text-xl leading-relaxed text-gray-200 md:text-2xl"
              data-reveal-delay="250ms"
            >
              Create stunning digital menus, accept instant orders with UPI & Razorpay, and manage
              everything from one powerful dashboard.
              <span className="mt-2 block font-bold text-orange-300">
                No credit card required • 14-day free trial
              </span>
            </p>

            {/* CTA Buttons */}
            <div
              className="reveal-on-scroll mb-12 flex flex-col items-start gap-4 sm:flex-row"
              data-reveal-delay="350ms"
            >
              <Link
                href="/signup?plan=advance&interval=yearly"
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-orange-600 to-red-600 px-10 py-5 text-xl font-bold text-white shadow-2xl transition-all hover:scale-105 hover:shadow-orange-500/50"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Start Free Trial
                  <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="reveal-on-scroll space-y-6" data-reveal-delay="450ms">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-orange-400 text-orange-400" />
                  ))}
                </div>
                <span className="text-lg font-bold text-white">Trusted by 500+ restaurants</span>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <span className="text-3xl">🍕</span>
                  <span className="font-bold text-white">Pizzerias</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <span className="text-3xl">☕</span>
                  <span className="font-bold text-white">Cafés</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <span className="text-3xl">🍔</span>
                  <span className="font-bold text-white">Fast Food</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
                  <span className="text-3xl">🍜</span>
                  <span className="font-bold text-white">Fine Dining</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 animate-bounce">
        <div className="flex h-14 w-9 items-start justify-center rounded-full border-2 border-white/50 p-2">
          <div className="h-3 w-1 animate-pulse rounded-full bg-white/70"></div>
        </div>
      </div>
    </section>
  );
}
