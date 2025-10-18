'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Check,
  AlertCircle,
  Package,
  ChefHat,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  DollarSign,
  User,
  MapPin,
  Phone,
  Calendar,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Store,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/contexts/SocketContext';
import { useNotifications } from '@/contexts/NotificationContext';

interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  priceCents: number;
  modifiers: { name: string; priceDelta: number }[];
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  tableNumber?: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalCents: number;
  notes?: string;
  createdAt: string;
  restaurant: {
    _id: string;
    name: string;
  };
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    iconColor: 'text-yellow-600',
    dotColor: 'bg-yellow-500',
  },
  preparing: {
    label: 'Preparing',
    icon: ChefHat,
    color:
      'bg-teal-100 text-teal-800 border-teal-200 animate-pulse shadow-lg shadow-teal-500/30 ring-2 ring-teal-400/20',
    iconColor: 'text-teal-600',
    dotColor: 'bg-teal-500',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    iconColor: 'text-green-600',
    dotColor: 'bg-green-500',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600',
    dotColor: 'bg-red-500',
  },
};

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { socket, isConnected, joinRestaurant } = useSocket();
  const { notificationsEnabled, soundEnabled, requestPermission, toggleSound } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');

  // Initialize search from URL (?search=...). Clear when missing.
  useEffect(() => {
    const s = searchParams.get('search');
    setSearchQuery(s ?? '');
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch restaurant first with proper error handling
    (async () => {
      try {
        const res = await fetch('/api/owner/restaurant', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
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
          throw new Error(errJson.error || 'Failed to fetch restaurant');
        }

        const data = await res.json();
        if (data.restaurants && data.restaurants.length > 0) {
          const firstRestaurant = data.restaurants[0];
          setRestaurantId(String(firstRestaurant._id));
          setCurrency(firstRestaurant?.settings?.currency || 'INR');
          setError('');
        } else {
          setError('no_restaurant');
          setLoading(false);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to fetch restaurant');
        setLoading(false);
      }
    })();
  }, [router]);

  // Join restaurant room for real-time updates
  useEffect(() => {
    if (!restaurantId || !socket || !isConnected) return;

    joinRestaurant(restaurantId);

    return () => {
      // Leave room on unmount
      socket.emit('leave-restaurant', restaurantId);
    };
  }, [restaurantId, socket, isConnected, joinRestaurant]);

  // Listen for real-time order updates
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = () => {
      if (!restaurantId) return;
      // Refetch orders when new order arrives
      fetchOrders();
    };

    const handleOrderUpdate = () => {
      if (!restaurantId) return;
      // Refetch orders when status changes
      fetchOrders();
    };

    socket.on('new-order', handleNewOrder);
    socket.on('order-status-updated', handleOrderUpdate);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-updated', handleOrderUpdate);
    };
  }, [socket, restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;

    fetchOrders();

    // Reduce polling since we have real-time updates now
    const interval = setInterval(fetchOrders, 30000); // 30 seconds backup

    return () => clearInterval(interval);
  }, [restaurantId]);

  const fetchOrders = async () => {
    try {
      if (!restaurantId) return; // Guard against race where restaurantId not loaded yet
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/owner/orders?restaurantId=${restaurantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
        throw new Error(errorData.error || 'Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setError(''); // Clear any previous errors
      setLoading(false);
    } catch (err: any) {
      console.error('Fetch orders error:', err);
      const msg = String(err?.message || '');
      // Benign race during first mount when restaurantId not yet resolved on server
      if (msg.includes('Restaurant ID is required')) {
        // Retry shortly after restaurantId is likely set
        setTimeout(() => {
          if (restaurantId) fetchOrders();
        }, 500);
        return;
      }
      // Only set error if we don't have orders already
      if (orders.length === 0) {
        setError(msg);
      }
      setLoading(false);
    }
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
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? { ...order, status: newStatus } : order))
      );

      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      console.error('Failed to update order status:', err);
    }
  };

  const formatPrice = (cents: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
    } catch {
      return `₹${(cents / 100).toFixed(2)}`;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const orderNumberSafe = order.orderNumber || String(order._id).slice(-8).toUpperCase();
    const matchesSearch =
      searchQuery === '' ||
      orderNumberSafe.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200"></div>
            <div className="h-10 w-32 animate-pulse rounded bg-gray-200"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Orders</h1>
              <p className="mt-1 text-gray-600 dark:text-slate-400">
                Manage incoming orders in real-time
                {isConnected && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-green-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
                    Live
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <button
                onClick={requestPermission}
                className={`rounded-lg border p-2 transition-colors ${
                  notificationsEnabled
                    ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                title={notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
              >
                {notificationsEnabled ? (
                  <Bell className="h-5 w-5" />
                ) : (
                  <BellOff className="h-5 w-5" />
                )}
              </button>

              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className={`rounded-lg border p-2 transition-colors ${
                  soundEnabled
                    ? 'border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
                title={soundEnabled ? 'Sound enabled' : 'Sound disabled'}
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>

              <Link
                href="/dashboard"
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {stats.total}
                  </p>
                </div>
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="rounded-lg bg-teal-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-700">Preparing</p>
                  <p className="text-2xl font-bold text-teal-900">{stats.preparing}</p>
                </div>
                <ChefHat className="h-8 w-8 text-teal-500" />
              </div>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('preparing')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === 'preparing'
                    ? 'animate-pulse bg-teal-600 text-white shadow-lg shadow-teal-500/50 ring-2 ring-teal-400/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Preparing
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                Completed
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  const params = new URLSearchParams(Array.from(searchParams.entries()));
                  if (val) {
                    params.set('search', val);
                  } else {
                    params.delete('search');
                  }
                  const q = params.toString();
                  router.replace(`/dashboard/orders${q ? `?${q}` : ''}`);
                }}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 md:w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Content */}
      <div className="container mx-auto px-4 py-8">
        {error === 'no_restaurant' ? (
          /* No Restaurant State */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 rounded-full bg-emerald-100 p-6 dark:bg-emerald-900/20">
              <Package className="h-16 w-16 text-emerald-600" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-slate-100">
              Welcome to QR Menu Manager!
            </h2>
            <p className="mb-8 max-w-md text-center text-gray-600 dark:text-slate-400">
              To start receiving orders, you need to create your first restaurant. Once created, you
              can build your menu and generate QR codes for customers.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard/restaurants/new"
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <Package className="h-5 w-5" />
                Create Your First Restaurant
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        ) : error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : null}

        {!error && filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 rounded-full bg-gray-100 p-6">
              <Package className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">
              {statusFilter === 'all'
                ? 'No Orders Yet'
                : `No ${statusConfig[statusFilter as keyof typeof statusConfig]?.label} Orders`}
            </h2>
            <p className="max-w-md text-center text-gray-600">
              {statusFilter === 'all'
                ? 'Orders will appear here when customers place them through your QR menu.'
                : `There are no orders with status "${statusConfig[statusFilter as keyof typeof statusConfig]?.label}" at the moment.`}
            </p>
          </div>
        ) : !error ? (
          /* Orders Grid */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={order._id}
                  className="group cursor-pointer rounded-lg border-2 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Order Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                          #{order.orderNumber}
                        </h3>
                        <div
                          className={`h-2 w-2 rounded-full ${status.dotColor} animate-pulse`}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <StatusIcon className={`h-6 w-6 ${status.iconColor}`} />
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${status.color}`}
                  >
                    {status.label}
                  </div>

                  {/* Customer Info */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{order.customerName}</span>
                    </div>
                    {order.tableNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                        <MapPin className="h-4 w-4" />
                        <span>Table {order.tableNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="mb-4 border-t border-gray-100 pt-4 dark:border-slate-800">
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                    <div className="space-y-1">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-slate-400">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-slate-100">
                            {formatPrice(item.priceCents * item.quantity)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          +{order.items.length - 2} more items
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-slate-800">
                    <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                      Total
                    </span>
                    <span className="text-xl font-bold text-emerald-600">
                      {formatPrice(order.totalCents)}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                    <div className="mt-4 flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order._id, 'preparing');
                          }}
                          className="flex-1 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order._id, 'completed');
                          }}
                          className="flex-1 animate-pulse rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-green-500/50 ring-2 ring-green-400/30 transition-colors hover:bg-green-700"
                        >
                          Complete Order
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    Order #{selectedOrder.orderNumber}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">
                    {formatDistanceToNow(new Date(selectedOrder.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-slate-200 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mt-4">
                {(() => {
                  const status = statusConfig[selectedOrder.status];
                  return (
                    <div
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 ${status.color}`}
                    >
                      <status.icon className="h-5 w-5" />
                      <span className="font-medium">{status.label}</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Content */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {/* Customer Information */}
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-gray-900 dark:text-slate-100">
                  Customer Information
                </h3>
                <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-slate-400">
                      {selectedOrder.customerEmail}
                    </span>
                  </div>
                  {selectedOrder.tableNumber && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-slate-400">
                        Table {selectedOrder.tableNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-gray-900 dark:text-slate-100">
                  Order Items
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-gray-200 p-4 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-slate-100">
                            {item.quantity}x {item.name}
                          </p>
                          {item.modifiers?.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {item.modifiers.map((mod, modIdx) => (
                                <p
                                  key={modIdx}
                                  className="text-sm text-gray-600 dark:text-slate-400"
                                >
                                  + {mod.name}
                                  {mod.priceDelta > 0 && ` (+${formatPrice(mod.priceDelta)})`}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-slate-100">
                            {formatPrice(item.priceCents * item.quantity)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            {formatPrice(item.priceCents)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mb-6">
                  <h3 className="mb-3 font-semibold text-gray-900 dark:text-slate-100">
                    Special Instructions
                  </h3>
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/40 dark:bg-yellow-900/20">
                    <p className="text-gray-700 dark:text-yellow-200">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-slate-800">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span className="text-gray-900 dark:text-slate-100">Total</span>
                  <span className="text-emerald-600">{formatPrice(selectedOrder.totalCents)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
              <div className="border-t bg-gray-50 p-6 dark:border-slate-800 dark:bg-slate-800">
                <div className="flex gap-3">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          updateOrderStatus(selectedOrder._id, 'preparing');
                          setSelectedOrder({ ...selectedOrder, status: 'preparing' });
                        }}
                        className="flex-1 rounded-lg bg-teal-600 px-4 py-3 font-medium text-white transition-colors hover:bg-teal-700"
                      >
                        Start Preparing
                      </button>
                      <button
                        onClick={() => {
                          updateOrderStatus(selectedOrder._id, 'cancelled');
                          setSelectedOrder(null);
                        }}
                        className="rounded-lg border border-red-300 px-4 py-3 font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <button
                      onClick={() => {
                        updateOrderStatus(selectedOrder._id, 'completed');
                        setSelectedOrder(null);
                      }}
                      className="flex-1 animate-pulse rounded-lg bg-green-600 px-4 py-3 font-medium text-white shadow-lg shadow-green-500/50 ring-2 ring-green-400/30 transition-colors hover:bg-green-700"
                    >
                      🔥 Complete Order
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
