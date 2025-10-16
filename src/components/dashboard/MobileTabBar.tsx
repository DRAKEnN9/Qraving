'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  QrCode,
  TrendingUp,
  Menu,
} from 'lucide-react';

export default function MobileTabBar() {
  const pathname = usePathname();

  const tabs = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/dashboard/orders', icon: ShoppingBag, label: 'Orders' },
    { href: '/dashboard/qr-codes', icon: QrCode, label: 'QR' },
    { href: '/dashboard/analytics', icon: TrendingUp, label: 'Stats' },
    { href: '/dashboard/settings', icon: Menu, label: 'More' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white lg:hidden">
      <nav className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
                active ? 'text-emerald-600' : 'text-slate-600'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{tab.label}</span>
              {active && (
                <div className="absolute bottom-0 h-1 w-16 rounded-t-full bg-emerald-600"></div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
