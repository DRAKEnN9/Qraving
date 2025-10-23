import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 py-24">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 opacity-10" data-parallax="0.06" data-parallax-dir="up">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2074')",
          }}
        ></div>
      </div>

      {/* Animated Particles */}
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-20 h-3 w-3 animate-float rounded-full bg-white opacity-20" data-parallax="0.18"></div>
        <div className="absolute right-1/3 top-32 h-2 w-2 animate-float rounded-full bg-yellow-300 opacity-30" style={{ animationDelay: '1s' }} data-parallax="0.16"></div>
        <div className="absolute left-1/2 bottom-40 h-3 w-3 animate-float rounded-full bg-orange-300 opacity-25" style={{ animationDelay: '2s' }} data-parallax="0.14"></div>
      </div>

      <div className="container relative mx-auto px-4 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 inline-block reveal-on-scroll" data-reveal-delay="100ms">
            <span className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-6 py-3 text-sm font-bold text-white shadow-xl">
              <Sparkles className="h-5 w-5" />
              LIMITED TIME OFFER
            </span>
          </div>

          <h2 className="mb-6 reveal-on-scroll text-4xl font-black text-white md:text-5xl lg:text-6xl" data-reveal-delay="150ms">
            Ready to Transform
            <br />
            Your Restaurant?
          </h2>
          <p className="mx-auto mb-10 max-w-3xl reveal-on-scroll text-xl leading-relaxed text-orange-50 md:text-2xl" data-reveal-delay="250ms">
            Join 500+ restaurants already using QR Menu Manager. 
            Start your free trial today - no credit card required, cancel anytime.
          </p>

          <div className="flex reveal-on-scroll flex-col items-center justify-center gap-4 sm:flex-row" data-reveal-delay="350ms">
            <Link
              href="/signup?plan=advance&interval=yearly"
              className="group flex w-full items-center justify-center gap-3 rounded-full bg-white px-10 py-5 text-xl font-black text-orange-600 shadow-2xl transition-all hover:scale-105 hover:shadow-white/50 sm:w-auto"
            >
              Start Your Free Trial
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
            </Link>
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white bg-white/10 backdrop-blur-sm px-10 py-5 text-xl font-bold text-white transition-all hover:bg-white/20 sm:w-auto"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-10 reveal-on-scroll flex flex-wrap items-center justify-center gap-6 text-orange-100" data-reveal-delay="450ms">
            <span className="flex items-center gap-2 text-lg">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              14-day free trial
            </span>
            <span className="flex items-center gap-2 text-lg">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No credit card required
            </span>
            <span className="flex items-center gap-2 text-lg">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
