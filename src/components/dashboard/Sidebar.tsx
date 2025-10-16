'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Menu as MenuIcon,
  QrCode,
  TrendingUp,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';

interface SidebarProps {
  isConnected?: boolean;
  lastSync?: Date;
  collapsed?: boolean; // controlled collapsed (desktop)
  onCollapseChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean; // controlled mobile visibility
  onMobileOpenChange?: (open: boolean) => void;
}

export default function Sidebar({ isConnected = false, lastSync, collapsed, onCollapseChange, mobileOpen, onMobileOpenChange }: SidebarProps) {
  // Controlled-or-internal collapsed state
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = typeof collapsed === 'boolean' ? collapsed : internalCollapsed;
  const setCollapsedState = (val: boolean) => {
    onCollapseChange?.(val);
    setInternalCollapsed(val);
  };

  // Controlled-or-internal mobile open state
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const isMobileOpen = typeof mobileOpen === 'boolean' ? mobileOpen : internalMobileOpen;
  const setMobileOpenState = (open: boolean) => {
    onMobileOpenChange?.(open);
    setInternalMobileOpen(open);
  };
  const pathname = usePathname();

  // Avoid hydration mismatch for time rendering by gating on client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/orders', icon: ShoppingBag, label: 'Orders' },
    { href: '/dashboard/restaurants', icon: Store, label: 'Restaurants' },
    { href: '/dashboard/menu-builder', icon: MenuIcon, label: 'Menu Builder' },
    { href: '/dashboard/qr-codes', icon: QrCode, label: 'QR Codes' },
    { href: '/dashboard/analytics', icon: TrendingUp, label: 'Analytics' },
    { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent lg:hidden"
          onClick={() => setMobileOpenState(false)}
        ></div>
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-full border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-2">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">QR Menu</span>
          </Link>
        )}
        <div className="flex items-center gap-2">
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpenState(false)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsedState(!isCollapsed)}
            className="hidden rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:inline-flex"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
              title={isCollapsed ? item.label : undefined}
              onClick={() => setMobileOpenState(false)}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-emerald-600' : 'dark:text-slate-300'}`} />
              {!isCollapsed && <span>{item.label}</span>}
              {!isCollapsed && active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer - Connection Status */}
      <div
        className={`border-t border-slate-200 p-3 dark:border-slate-800 ${
          isCollapsed ? 'flex justify-center' : ''
        }`}
      >
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
            isConnected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
          }`}
        >
          {isConnected ? (
            <Wifi className="h-4 w-4 flex-shrink-0 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 flex-shrink-0 text-red-600" />
          )}
          {!isCollapsed && (
            <div className="flex-1">
              <p
                className={`text-xs font-medium ${
                  isConnected ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}
              >
                {isConnected ? 'Connected' : 'Offline'}
              </p>
              {mounted && lastSync && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span suppressHydrationWarning>
                    {new Date(lastSync).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}
