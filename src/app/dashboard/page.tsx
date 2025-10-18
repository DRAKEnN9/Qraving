'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Clock,
  Plus,
  ArrowRight,
  QrCode,
  Package,
  ChefHat,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  tableNumber?: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  items: Array<{
    name: string;
    quantity: number;
    priceCents: number;
  }>;
  totalCents: number;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { socket, isConnected, joinRestaurant } = useSocket();
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    openOrders: 0,
    totalRestaurants: 0,
    totalMenuItems: 0,
    previousDayOrders: 0,
    previousMonthRevenue: 0,
  });
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [topItems, setTopItems] = useState<Array<{ name: string; count: number }>>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch restaurant and stats
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Join restaurant room and listen for real-time order updates
  useEffect(() => {
    if (!restaurantId || !socket || !isConnected) return;

    // Ensure we join the restaurant room to receive room-scoped events
    joinRestaurant(restaurantId);

    const handleNewOrder = () => {
      fetchDashboardData();
    };

    const handleOrderUpdate = () => {
      fetchDashboardData();
    };

    socket.on('new-order', handleNewOrder);
    socket.on('order-status-updated', handleOrderUpdate);

    return () => {
      // Leave the room on unmount or when restaurant changes
      socket.emit('leave-restaurant', restaurantId);
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-updated', handleOrderUpdate);
    };
  }, [socket, isConnected, restaurantId, joinRestaurant]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch restaurant
      const resRes = await fetch('/api/owner/restaurant', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resRes.ok) throw new Error('Failed to fetch restaurant');

      const resData = await resRes.json();
      if (resData.restaurants && resData.restaurants.length > 0) {
        const restaurant = resData.restaurants[0];
        setRestaurantId(restaurant._id);
        setCurrency(restaurant?.settings?.currency || 'INR');

        // Calculate menu items
        let totalMenuItems = 0;
        restaurant.menu?.forEach((category: any) => {
          totalMenuItems += category.items?.length || 0;
        });

        // Fetch orders
        const ordersRes = await fetch(`/api/owner/orders?restaurantId=${restaurant._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const orders = ordersData.orders || [];

          // Calculate stats
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

          const todayOrders = orders.filter((o: any) => new Date(o.createdAt) >= today);
          const yesterdayOrders = orders.filter(
            (o: any) => new Date(o.createdAt) >= yesterday && new Date(o.createdAt) < today
          );
          const monthOrders = orders.filter((o: any) => new Date(o.createdAt) >= monthStart);
          const lastMonthOrders = orders.filter(
            (o: any) =>
              new Date(o.createdAt) >= lastMonthStart && new Date(o.createdAt) <= lastMonthEnd
          );
          const openOrders = orders.filter(
            (o: any) => o.status === 'pending' || o.status === 'preparing'
          );

          setStats({
            todayOrders: todayOrders.length,
            todayRevenue: todayOrders.reduce((sum: number, o: any) => sum + (o.totalCents || 0), 0),
            monthRevenue: monthOrders.reduce((sum: number, o: any) => sum + (o.totalCents || 0), 0),
            openOrders: openOrders.length,
            totalRestaurants: resData.restaurants.length,
            totalMenuItems,
            previousDayOrders: yesterdayOrders.length,
            previousMonthRevenue: lastMonthOrders.reduce(
              (sum: number, o: any) => sum + (o.totalCents || 0),
              0
            ),
          });

          // Set live orders (recent pending/preparing)
          setLiveOrders(
            orders
              .filter((o: any) => o.status === 'pending' || o.status === 'preparing')
              .sort(
                (a: any, b: any) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              )
              .slice(0, 5)
          );

          // Calculate top items
          const itemCounts: Record<string, number> = {};
          orders.forEach((order: any) => {
            order.items?.forEach((item: any) => {
              itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
            });
          });
          const sortedItems = Object.entries(itemCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
          setTopItems(sortedItems);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
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

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/owner/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update order status');

      // Update local state
      setLiveOrders((prev) =>
        prev
          .map((order) => (order._id === orderId ? { ...order, status: newStatus } : order))
          .filter((o) => o.status === 'pending' || o.status === 'preparing')
      );
    } catch (err: any) {
      console.error('Failed to update order status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 animate-pulse text-emerald-600" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const todayChange = calculateChange(stats.todayOrders, stats.previousDayOrders);
  const revenueChange = calculateChange(stats.monthRevenue, stats.previousMonthRevenue);

  return (
    <div className="space-y-6">
      {/* Hero Stats Cards - 3 Column Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Orders Today */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Orders Today</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                {stats.todayOrders}
              </p>
              <div className="mt-2 flex items-center gap-1">
                {todayChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${todayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {Math.abs(todayChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          {/* Mini sparkline placeholder */}
          <div className="mt-4 flex h-8 items-end justify-between gap-1">
            {[3, 5, 4, 6, 8, 7, 9].map((height, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-blue-200"
                style={{ height: `${height * 10}%` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Revenue (MTD) */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Revenue (MTD)
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                {formatPrice(stats.monthRevenue)}
              </p>
              <div className="mt-2 flex items-center gap-1">
                {revenueChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {Math.abs(revenueChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Open Orders */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Open Orders</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                {stats.openOrders}
              </p>
              <div className="mt-2 flex items-center gap-1">
                {stats.openOrders > 5 ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Needs attention</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">On track</span>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace - 2 Column Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Live Orders Feed - Left Column */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Live Orders
            </h2>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {liveOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-16 w-16 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">No active orders</p>
              <p className="text-sm text-slate-500">
                Orders will appear here when customers place them
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveOrders.map((order) => (
                <div
                  key={order._id}
                  className="group cursor-pointer rounded-lg border border-slate-200 p-4 transition-all hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          #{order.orderNumber}
                        </span>
                        {order.tableNumber && (
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            • Table {order.tableNumber}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-teal-100 text-teal-700'
                          }`}
                        >
                          {order.status === 'pending' ? 'New' : 'Preparing'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {order.customerName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'} •{' '}
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">
                        {formatPrice(order.totalCents)}
                      </p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-3 flex gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order._id, 'preparing');
                        }}
                        className="flex-1 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                      >
                        Accept
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order._id, 'completed');
                        }}
                        className="flex-1 animate-pulse rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg shadow-green-500/50 ring-2 ring-green-400/30 transition-colors hover:bg-green-700"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order._id, 'cancelled');
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Top Items & Quick Actions */}
        <div className="space-y-6">
          {/* Top Selling Items */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Top Selling
            </h2>
            {topItems.length === 0 ? (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                No orders yet
              </p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : index === 1
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-teal-100 text-teal-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:border-emerald-900/30 dark:from-emerald-900/20 dark:to-teal-900/20">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/dashboard/qr-codes"
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="rounded-lg bg-emerald-100 p-2">
                  <QrCode className="h-5 w-5 text-emerald-700" />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Create QR Code
                </span>
              </Link>
              <Link
                href="/dashboard/menu-builder"
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="rounded-lg bg-teal-100 p-2">
                  <Plus className="h-5 w-5 text-teal-700" />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Add Menu Item
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
