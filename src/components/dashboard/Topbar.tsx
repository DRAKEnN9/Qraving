'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  CreditCard,
  UserPlus,
  FolderPlus,
  UtensilsCrossed,
  Menu,
  X,
} from 'lucide-react';

interface TopbarProps {
  user?: {
    name: string;
    email: string;
  };
  onLogout: () => void;
  sidebarCollapsed?: boolean;
  onOpenMobileSidebar?: () => void;
}

export default function Topbar({ user, onLogout, sidebarCollapsed, onOpenMobileSidebar }: TopbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  // Keep Topbar search in sync with URL (?search=...)
  useEffect(() => {
    const s = searchParams.get('search');
    setSearchQuery(s ?? '');
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    // Navigate to Orders. If empty, clear the filter by omitting the param
    if (q) {
      router.push(`/dashboard/orders?search=${encodeURIComponent(q)}`);
    } else {
      router.push('/dashboard/orders');
    }
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 ${
        sidebarCollapsed ? 'lg:left-[5rem]' : 'lg:left-64'
      }`}
    >
      <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-6">
        {/* Left side - Logo (Mobile) + Search */}
        <div className="flex flex-1 items-center gap-3">
          {/* Mobile Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => onOpenMobileSidebar?.()}
              className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Open Sidebar"
              title="Open Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5">
              <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-full sm:max-w-sm lg:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-10 pr-4 text-sm transition-all focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:bg-slate-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    router.push('/dashboard/orders');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-300"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right side - Quick Actions & Profile */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Quick Actions Dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setQuickActionsOpen(!quickActionsOpen)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setTimeout(() => setQuickActionsOpen(false), 200);
                }
              }}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 lg:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">New</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {quickActionsOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <button
                  onClick={() => {
                    router.push('/dashboard/menu-builder?action=new-category');
                    setQuickActionsOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <FolderPlus className="h-4 w-4 text-emerald-600" />
                  New Category
                </button>
                <button
                  onClick={() => {
                    router.push('/dashboard/menu-builder?action=new-item');
                    setQuickActionsOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <UtensilsCrossed className="h-4 w-4 text-emerald-600" />
                  New Menu Item
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button
            onClick={() => router.push('/dashboard/orders')}
            className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setTimeout(() => setProfileOpen(false), 200);
                }
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 lg:px-3 lg:py-2"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white lg:text-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="hidden lg:inline">{user?.name || 'User'}</span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                {/* User Info */}
                <div className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{user?.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{user?.email}</p>
                </div>

                {/* Account Section */}
                <div className="py-2">
                  <p className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Account</p>
                  <button
                    onClick={() => {
                      router.push('/dashboard/account/profile');
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <User className="h-4 w-4 text-emerald-600" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      router.push('/dashboard/settings');
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4 text-emerald-600" />
                    Settings
                  </button>
                </div>

                {/* Subscription Section */}
                <div className="border-t border-slate-100 py-2 dark:border-slate-800">
                  <p className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Subscription</p>
                  <button
                    onClick={() => {
                      router.push('/dashboard/billing');
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    Billing
                  </button>
                  <button
                    onClick={() => {
                      router.push('/dashboard/settings?tab=team');
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <UserPlus className="h-4 w-4 text-emerald-600" />
                    Team
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-slate-100 pt-2 dark:border-slate-800">
                  <button
                    onClick={() => {
                      onLogout();
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
