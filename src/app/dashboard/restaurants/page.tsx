'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  QrCode,
  Settings,
  ExternalLink,
  Users,
  Calendar,
  DollarSign,
  ShoppingBag,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  address: string;
  tableNumber: number;
  logo?: string;
  logoUrl?: string;
  createdAt: string;
}

export default function RestaurantsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsMap, setAnalyticsMap] = useState<
    Record<string, { revenueCents: number; orders: number; aovCents: number; completed: number }>
  >({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/owner/restaurant', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch restaurants');
        return res.json();
      })
      .then((data) => {
        setRestaurants(data.restaurants || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (cents: number) => {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(cents / 100);
    } catch {
      return `₹${(cents / 100).toFixed(2)}`;
    }
  };

  // Fetch per-restaurant analytics for mini stats (last 24h)
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!restaurants.length) return;
      setAnalyticsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const results = await Promise.all(
          restaurants.map(async (r) => {
            try {
              const res = await fetch(
                `/api/owner/analytics?restaurantId=${encodeURIComponent(r._id)}&days=1`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (!res.ok) throw new Error('Failed');
              const data = await res.json();
              return [
                r._id,
                {
                  revenueCents: data.metrics?.totalRevenue || 0,
                  orders: data.metrics?.totalOrders || 0,
                  aovCents: data.metrics?.averageOrderValue || 0,
                  completed: (data.metrics?.ordersByStatus?.completed as number) || 0,
                },
              ] as const;
            } catch {
              return [r._id, { revenueCents: 0, orders: 0, aovCents: 0, completed: 0 }] as const;
            }
          })
        );
        const map: Record<
          string,
          { revenueCents: number; orders: number; aovCents: number; completed: number }
        > = {};
        results.forEach(([id, summary]) => {
          map[id] = summary;
        });
        setAnalyticsMap(map);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    fetchAnalytics();
  }, [restaurants]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200"></div>
            <div className="h-10 w-32 animate-pulse rounded bg-gray-200"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Content */}
      <div className={`container mx-auto px-4 ${restaurants.length === 0 ? 'py-8' : 'pt-0 pb-8'}`}>
        {(error || searchParams?.get('limit') === '1') && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
            <p className="text-red-600">
              {error || 'Restaurant limit reached. Your plan allows 1 restaurant per account.'}
            </p>
          </div>
        )}

        {restaurants.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 rounded-full bg-teal-100 p-6">
              <QrCode className="h-16 w-16 text-teal-600" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-slate-100">Create Your First Restaurant</h2>
            <p className="mb-8 max-w-md text-center text-gray-600 dark:text-slate-400">
              Get started by adding your restaurant details and generating a QR code menu for your customers.
            </p>
            <Link
              href="/dashboard/restaurants/new"
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-all hover:bg-emerald-700 hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Add Your First Restaurant
            </Link>
          </div>
        ) : restaurants.length === 1 ? (
          // Full-width hero card for a single restaurant
          <div className="w-full">
            {(() => {
              const r = restaurants[0];
              return (
                <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800">
                  {/* Hero Header */}
                  <div className="relative h-64 bg-gradient-to-br from-teal-500 to-emerald-600 md:h-80">
                    {r.logoUrl || r.logo ? (
                      <Image
                        src={(r.logoUrl || r.logo)!}
                        alt={r.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-6xl font-black text-white md:text-7xl">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Action Buttons */}
                    <div className="absolute right-4 top-4 flex gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <Link
                        href={`/dashboard/restaurants/${r._id}/settings`}
                        className="rounded-full bg-white/90 p-2 text-gray-700 transition-colors hover:bg-white"
                        title="Settings"
                      >
                        <Settings className="h-5 w-5" />
                      </Link>
                      <Link
                        href={`/menu/${r.slug}`}
                        target="_blank"
                        className="rounded-full bg-white/90 p-2 text-gray-700 transition-colors hover:bg-white"
                        title="View Menu"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 md:p-8">
                    <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-slate-100 md:text-3xl">{r.name}</h3>
                    <p className="mb-6 line-clamp-3 text-sm text-gray-600 dark:text-slate-400 md:text-base">{r.address}</p>

                    {/* Stats */}
                    <div className="mb-6 flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-slate-400 md:text-base">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{r.tableNumber} tables</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Since {formatDate(r.createdAt)}</span>
                      </div>
                    </div>

                    {/* Mini Stats (last 24h) */}
                    <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <DollarSign className="h-5 w-5 text-emerald-600" />
                        <div className="text-sm">
                          <p className="font-semibold leading-tight text-emerald-700">
                            {analyticsLoading ? '—' : formatPrice(analyticsMap[r._id]?.revenueCents || 0)}
                          </p>
                          <p className="text-[11px] text-emerald-700/80">Today</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3">
                        <ShoppingBag className="h-5 w-5 text-teal-600" />
                        <div className="text-sm">
                          <p className="font-semibold leading-tight text-teal-700">
                            {analyticsLoading ? '—' : (analyticsMap[r._id]?.orders ?? 0)}
                          </p>
                          <p className="text-[11px] text-teal-700/80">Orders</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                        <div className="text-sm">
                          <p className="font-semibold leading-tight text-indigo-700">
                            {analyticsLoading ? '—' : formatPrice(analyticsMap[r._id]?.aovCents || 0)}
                          </p>
                          <p className="text-[11px] text-indigo-700/80">AOV</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800">
                        <CheckCircle2 className="h-5 w-5 text-slate-600" />
                        <div className="text-sm">
                          <p className="font-semibold leading-tight text-slate-700 dark:text-slate-200">
                            {analyticsLoading ? '—' : (analyticsMap[r._id]?.completed ?? 0)}
                          </p>
                          <p className="text-[11px] text-slate-700/80 dark:text-slate-400">Completed</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/dashboard/qr-codes"
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                      >
                        <QrCode className="h-5 w-5" />
                        QR Code
                      </Link>
                      <Link
                        href={`/dashboard/menu-builder/${r._id}`}
                        className="flex w-full items-center justify-center rounded-lg bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Manage Menu
                      </Link>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="absolute left-3 top-3">
                    <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                      Active
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          /* Multi-restaurant grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:border dark:border-slate-800"
              >
                {/* Restaurant Header */}
                <div className="relative h-40 bg-gradient-to-br from-teal-500 to-emerald-600">
                  {restaurant.logoUrl || restaurant.logo ? (
                    <Image
                      src={(restaurant.logoUrl || restaurant.logo)!}
                      alt={restaurant.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
                      {restaurant.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Action Buttons */}
                  <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <Link
                      href={`/dashboard/restaurants/${restaurant._id}/settings`}
                      className="rounded-full bg-white bg-opacity-90 p-2 text-gray-700 transition-colors hover:bg-white"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/menu/${restaurant.slug}`}
                      target="_blank"
                      className="rounded-full bg-white bg-opacity-90 p-2 text-gray-700 transition-colors hover:bg-white"
                      title="View Menu"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Restaurant Info */}
                <div className="p-4 sm:p-6">
                  <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-slate-100">{restaurant.name}</h3>
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-slate-400">{restaurant.address}</p>

                  {/* Stats */}
                  <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{restaurant.tableNumber} tables</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(restaurant.createdAt)}</span>
                    </div>
                  </div>

                  {/* Mini Stats (last 24h) */}
                  <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <div className="text-sm">
                        <p className="font-semibold leading-tight text-emerald-700">
                          {analyticsLoading ? '—' : formatPrice(analyticsMap[restaurant._id]?.revenueCents || 0)}
                        </p>
                        <p className="text-[11px] text-emerald-700/80">Today</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
                      <ShoppingBag className="h-4 w-4 text-teal-600" />
                      <div className="text-sm">
                        <p className="font-semibold leading-tight text-teal-700">
                          {analyticsLoading ? '—' : (analyticsMap[restaurant._id]?.orders ?? 0)}
                        </p>
                        <p className="text-[11px] text-teal-700/80">Orders</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                      <BarChart3 className="h-4 w-4 text-indigo-600" />
                      <div className="text-sm">
                        <p className="font-semibold leading-tight text-indigo-700">
                          {analyticsLoading ? '—' : formatPrice(analyticsMap[restaurant._id]?.aovCents || 0)}
                        </p>
                        <p className="text-[11px] text-indigo-700/80">AOV</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
                      <CheckCircle2 className="h-4 w-4 text-slate-600" />
                      <div className="text-sm">
                        <p className="font-semibold leading-tight text-slate-700 dark:text-slate-200">
                          {analyticsLoading ? '—' : (analyticsMap[restaurant._id]?.completed ?? 0)}
                        </p>
                        <p className="text-[11px] text-slate-700/80 dark:text-slate-400">Completed</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/dashboard/qr-codes"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                    >
                      <QrCode className="h-4 w-4" />
                      QR Code
                    </Link>
                    <Link
                      href={`/dashboard/menu-builder/${restaurant._id}`}
                      className="flex w-full items-center justify-center rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Manage Menu
                    </Link>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="absolute left-3 top-3">
                  <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                    Active
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Removed quick stats for a cleaner, focused UI */}
      </div>
    </div>
  );
}
