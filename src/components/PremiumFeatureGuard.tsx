'use client';

import { ReactNode } from 'react';
import { Lock, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PremiumFeatureGuardProps {
  children: ReactNode;
  isLocked: boolean;
  featureName: string;
  description?: string;
  className?: string;
}

export default function PremiumFeatureGuard({
  children,
  isLocked,
  featureName,
  description,
  className = '',
}: PremiumFeatureGuardProps) {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Blurred content */}
      <div className="pointer-events-none select-none blur-sm">{children}</div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-slate-900/95 via-slate-800/90 to-purple-900/95 p-4 backdrop-blur-sm">
        <div className="max-h-full max-w-md space-y-4 overflow-y-auto p-6 text-center md:space-y-6 md:p-8">
          {/* Premium Badge */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-2xl shadow-orange-500/50">
            <Crown className="h-10 w-10 text-white drop-shadow-lg" />
          </div>

          {/* Heading */}
          <div>
            <h3 className="mb-2 text-2xl font-bold text-white">
              {featureName}
            </h3>
            <p className="text-sm text-slate-300">
              {description || 'This feature is available on the Advance Plan'}
            </p>
          </div>

          {/* Features List */}
          <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
              Advance Plan Benefits
            </p>
            <ul className="space-y-2 text-left text-sm text-white">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Full Analytics Dashboard</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Revenue Insights & Trends</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Top Selling Items</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Peak Hours Analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Advanced Reports</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <Link
            href="/dashboard/billing"
            className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-orange-500/60"
          >
            <Lock className="h-5 w-5" />
            Upgrade to Advance Plan
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Pricing Hint */}
          <p className="text-xs text-slate-400">
            Starting at just ₹1,999/month or ₹19,999/year
          </p>
        </div>
      </div>
    </div>
  );
}
