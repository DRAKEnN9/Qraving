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
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="mb-4 text-6xl">📊</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Analytics Unavailable</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { metrics, previous, topItems, dailyRevenue } = analytics;

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
              <div className="flex h-64 items-center justify-center text-gray-500 dark:text-slate-400">
                No revenue data available
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
              <div className="flex h-48 items-center justify-center text-gray-500 dark:text-slate-400">
                No order data available
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
    </div>
  );
}
