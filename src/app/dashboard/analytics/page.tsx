'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Star,
  ArrowUp,
  ArrowDown,
  BarChart3,
  TrendingUp,
  Target,
  Lightbulb,
  ExternalLink,
  Store,
  Plus,
  AlertCircle,
} from 'lucide-react';

interface Analytics {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: {
      pending?: number;
      preparing?: number;
      completed?: number;
      cancelled?: number;
    };
  };
  previous: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersByStatus: Record<string, number>;
  };
  topItems: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
  }>;
  peakHours: Array<{
    hour: number;
    orders: number;
  }> | null;
}

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [currency, setCurrency] = useState<string>('INR');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch restaurant first
    (async () => {
      try {
        const res = await fetch('/api/owner/restaurant', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          if (res.status === 401) {
            setError('Unauthorized');
            setLoading(false);
            router.push('/login');
            return;
          }
          if (res.status === 402) {
            setError('Subscription required');
            setLoading(false);
            return;
          }
          throw new Error(j.error || 'Failed to fetch restaurant');
        }
        const data = await res.json();
        if (data.restaurants && data.restaurants.length > 0) {
          const r = data.restaurants[0];
          setRestaurantId(r._id);
          setCurrency(r?.settings?.currency || 'INR');
        } else {
          setError('No restaurant found');
          setLoading(false);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to fetch restaurant');
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!restaurantId) return;

    fetchAnalytics();
  }, [restaurantId, period]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/owner/analytics?restaurantId=${restaurantId}&days=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const j = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setError('Unauthorized');
          setLoading(false);
          router.push('/login');
          return;
        }
        if (response.status === 402) {
          setError('Subscription required');
          setLoading(false);
          return;
        }
        throw new Error(j.error || 'Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
    } catch {
      return `₹${(cents / 100).toFixed(2)}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const calculateChange = (current: number, previous: number) => {
    if (!isFinite(previous) || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl">
            {error === 'No restaurant found' ? (
              /* No Restaurant State */
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-12">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-red-100">
                  <Store className="h-12 w-12 text-orange-600" />
                </div>
                
                <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  No Restaurant Found
                </h2>
                <p className="mx-auto mb-8 max-w-md text-slate-600 dark:text-slate-400">
                  You need to create a restaurant first before you can view analytics. Set up your restaurant profile to get started.
                </p>

                {/* Action Buttons */}
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    onClick={() => router.push('/dashboard/restaurants/new')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-700"
                  >
                    <Plus className="h-5 w-5" />
                    Create Restaurant
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/restaurants')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Store className="h-5 w-5" />
                    View Restaurants
                  </button>
                </div>

                {/* Setup Steps */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-left dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full bg-orange-100 p-2">
                      <Target className="h-5 w-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Quick Setup Guide</h3>
                  </div>
                  <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">1</span>
                      <span><strong>Create Restaurant:</strong> Add your restaurant name, address, and basic details</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">2</span>
                      <span><strong>Build Menu:</strong> Add categories and menu items with prices</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">3</span>
                      <span><strong>Setup Payments:</strong> Configure UPI payment options</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">4</span>
                      <span><strong>Go Live:</strong> Generate QR codes and start accepting orders</span>
                    </li>
                  </ol>
                </div>
              </div>
            ) : error === 'Subscription required' ? (
              /* Subscription Required State */
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-12">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100">
                  <AlertCircle className="h-12 w-12 text-purple-600" />
                </div>
                
                <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Subscription Required
                </h2>
                <p className="mx-auto mb-8 max-w-md text-slate-600 dark:text-slate-400">
                  Access to detailed analytics requires an active subscription. Upgrade your plan to unlock insights about your restaurant's performance.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    onClick={() => router.push('/dashboard/billing')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    <ExternalLink className="h-5 w-5" />
                    View Billing
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              /* General Error State */
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-12">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-pink-100">
                  <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
                
                <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Analytics Unavailable
                </h2>
                <p className="mx-auto mb-8 max-w-md text-slate-600 dark:text-slate-400">
                  {error || 'Unable to load analytics data at this time. Please try again later.'}
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-600 px-6 py-3 font-medium text-white transition-colors hover:bg-slate-700"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const { metrics, previous, topItems, dailyRevenue } = analytics;

  // Check if we have any meaningful data
  const hasData = metrics.totalOrders > 0 || topItems.length > 0 || dailyRevenue.some(d => d.revenue > 0);

  // Changes vs previous period
  const revenueChange = calculateChange(metrics.totalRevenue, previous?.totalRevenue || 0);
  const ordersChange = calculateChange(metrics.totalOrders, previous?.totalOrders || 0);
  const aovChange = calculateChange(metrics.averageOrderValue, previous?.averageOrderValue || 0);
  const completedNow = metrics.ordersByStatus.completed || 0;
  const completedPrev = (previous?.ordersByStatus?.completed as number) || 0;
  const completedChange = calculateChange(completedNow, completedPrev);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Analytics</h1>
              <p className="text-gray-600 dark:text-slate-400">Track your restaurant's performance</p>
            </div>

            {/* Period Selector */}
            <div className="flex gap-2 rounded-lg bg-gray-100 p-1 dark:bg-slate-800">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setPeriod(days as 7 | 30 | 90)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    period === days
                      ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400'
                      : 'text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {!hasData ? (
          /* Empty State - No Data */
          <div className="mx-auto max-w-4xl">
            {/* Main Empty State */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-12">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
                <BarChart3 className="h-12 w-12 text-emerald-600" />
              </div>
              
              <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
                No Analytics Data Yet
              </h2>
              <p className="mx-auto mb-8 max-w-md text-slate-600 dark:text-slate-400">
                Start taking orders to see detailed analytics about your restaurant's performance, popular items, and revenue trends.
              </p>

              {/* Quick Actions */}
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => router.push('/dashboard/menu-builder')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <Target className="h-5 w-5" />
                  Build Your Menu
                </button>
                <button
                  onClick={() => router.push('/dashboard/qr-codes')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ExternalLink className="h-5 w-5" />
                  Share QR Code
                </button>
              </div>

              {/* Preview Cards */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="rounded-full bg-emerald-100 p-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-xs text-slate-500">Revenue</div>
                  </div>
                  <div className="text-lg font-bold text-slate-400">₹0.00</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="rounded-full bg-blue-100 p-2">
                      <ShoppingBag className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-xs text-slate-500">Orders</div>
                  </div>
                  <div className="text-lg font-bold text-slate-400">0</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="rounded-full bg-teal-100 p-2">
                      <BarChart3 className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="text-xs text-slate-500">Avg Order</div>
                  </div>
                  <div className="text-lg font-bold text-slate-400">₹0.00</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="rounded-full bg-purple-100 p-2">
                      <Users className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-xs text-slate-500">Customers</div>
                  </div>
                  <div className="text-lg font-bold text-slate-400">0</div>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-3">
                    <Lightbulb className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Getting Started Tips</h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500"></span>
                    <span><strong>Create Menu Items:</strong> Add categories and dishes with attractive photos and descriptions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500"></span>
                    <span><strong>Generate QR Code:</strong> Place QR codes on tables for easy customer access</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500"></span>
                    <span><strong>Set Up Payments:</strong> Configure UPI payments to accept orders instantly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500"></span>
                    <span><strong>Test Your Setup:</strong> Place a test order to ensure everything works smoothly</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-full bg-teal-100 p-3">
                    <TrendingUp className="h-6 w-6 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">What You'll See</h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500"></span>
                    <span><strong>Revenue Trends:</strong> Daily, weekly, and monthly sales performance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500"></span>
                    <span><strong>Popular Items:</strong> Best-selling dishes and customer favorites</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500"></span>
                    <span><strong>Peak Hours:</strong> Busiest times and ordering patterns</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-500"></span>
                    <span><strong>Order Analytics:</strong> Completion rates and customer behavior insights</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          /* Normal Analytics Content */
          <div>
            {/* Key Metrics */}
            <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <DollarSign className="h-8 w-8 opacity-80" />
              <div className="flex items-center gap-1 text-sm">
                {revenueChange >= 0 ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                <span className="font-semibold">{Math.abs(revenueChange).toFixed(1)}%</span>
              </div>
            </div>
            <p className="mb-1 text-sm opacity-90">Total Revenue</p>
            <p className="text-3xl font-bold">{formatPrice(metrics.totalRevenue)}</p>
          </div>

          {/* Total Orders */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <div className="rounded-full bg-emerald-100 p-3">
                <ShoppingBag className="h-6 w-6 text-emerald-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${ordersChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {ordersChange >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                <span className="font-semibold">{Math.abs(ordersChange).toFixed(1)}%</span>
              </div>
            </div>
            <p className="mb-1 text-sm text-gray-600 dark:text-slate-400">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{metrics.totalOrders}</p>
          </div>

          {/* Average Order Value */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <div className="rounded-full bg-teal-100 p-3">
                <BarChart3 className="h-6 w-6 text-teal-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${aovChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {aovChange >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                <span className="font-semibold">{Math.abs(aovChange).toFixed(1)}%</span>
              </div>
            </div>
            <p className="mb-1 text-sm text-gray-600 dark:text-slate-400">Avg Order Value</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              {formatPrice(metrics.averageOrderValue)}
            </p>
          </div>

          {/* Completed Orders */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between">
              <div className="rounded-full bg-cyan-100 p-3">
                <Users className="h-6 w-6 text-cyan-600" />
              </div>
              <div className={`flex items-center gap-1 text-sm ${completedChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {completedChange >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                <span className="font-semibold">{Math.abs(completedChange).toFixed(1)}%</span>
              </div>
            </div>
            <p className="mb-1 text-sm text-gray-600 dark:text-slate-400">Completed Orders</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              {metrics.ordersByStatus.completed || 0}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Revenue Chart */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Revenue Trend</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400">Daily revenue over the last {period} days</p>
              </div>
            </div>

            {dailyRevenue.length > 0 ? (
              <div className="space-y-4">
                {/* Simple bar chart */}
                <div className="flex h-64 items-end justify-between gap-1">
                  {dailyRevenue.slice(-14).map((day, index) => {
                    const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue));
                    const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div
                        key={index}
                        className="group relative flex-1 cursor-pointer"
                        title={`${formatDate(day.date)}: ${formatPrice(day.revenue)}`}
                      >
                        <div
                          className="w-full rounded-t-lg bg-emerald-500 transition-all group-hover:bg-emerald-600"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="mt-2 text-center">
                          <span className="text-xs text-gray-500">
                            {new Date(day.date).getDate()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between border-t pt-4 text-sm text-gray-600 dark:border-slate-800 dark:text-slate-400">
                  <span>
                    {formatDate(dailyRevenue[Math.max(0, dailyRevenue.length - 14)].date)}
                  </span>
                  <span>{formatDate(dailyRevenue[dailyRevenue.length - 1].date)}</span>
                </div>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <div className="mb-3 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                  <BarChart3 className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mb-2 font-medium text-slate-700 dark:text-slate-300">No Revenue Data</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Revenue charts will appear here once you start receiving orders
                </p>
              </div>
            )}
          </div>

          {/* Top Items */}
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-900 dark:border dark:border-slate-800">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Popular Items</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400">Best selling menu items</p>
              </div>
              <Star className="h-6 w-6 text-yellow-500" />
            </div>

            {topItems.length > 0 ? (
              <div className="space-y-4">
                {topItems.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : index === 1
                            ? 'bg-gray-100 text-gray-700'
                            : index === 2
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">{item.name}</p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{item.count} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-slate-100">{formatPrice(item.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <div className="mb-3 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                  <Star className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mb-2 font-medium text-slate-700 dark:text-slate-300">No Popular Items Yet</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your top-selling dishes will be listed here
                </p>
              </div>
            )}
          </div>

            </div>

            {/* Order Status Breakdown */}
            <div className="mt-8 rounded-lg bg-white p-6 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-slate-100">Order Status</h2>
              <div className="grid gap-4 md:grid-cols-4">
                {(['pending', 'preparing', 'completed', 'cancelled'] as const).map((status) => (
                  <div key={status} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="mb-2 text-sm font-medium capitalize text-slate-600 dark:text-slate-400">{status}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{metrics.ordersByStatus[status] || 0}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
