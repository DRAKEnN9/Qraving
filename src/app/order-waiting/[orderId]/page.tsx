'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Clock, ChefHat, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import OrderStatusToast from '@/components/ui/OrderStatusToast';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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
  customerEmail?: string;
  customerPhone?: string;
  tableNumber?: number;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalCents: number;
  currency?: string;
  notes?: string;
  createdAt: string;
  restaurant: {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
  };
}

interface ToastState {
  isVisible: boolean;
  title: string;
  message: string;
  type: 'success' | 'waiting' | 'preparing';
}

export const dynamic = 'force-dynamic';

export default function OrderWaitingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;
  const { socket, isConnected, joinOrder } = useSocket();

  // Debug logging
  useEffect(() => {
    console.log('🎯 Order Waiting Page loaded with orderId:', orderId);
  }, [orderId]);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    title: '',
    message: '',
    type: 'waiting',
  });

  // Fetch order details
  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Set up socket connection and join order room
  useEffect(() => {
    if (orderId && socket && isConnected) {
      console.log('Joining order room:', orderId);
      joinOrder(orderId);

      // Listen for order status updates
      const handleOrderStatusUpdate = (data: any) => {
        console.log('Received order status update:', data);
        if (data.orderId === orderId) {
          // Update order status
          setOrder((prevOrder) => {
            if (prevOrder) {
              return { ...prevOrder, status: data.status };
            }
            return prevOrder;
          });

          // Show appropriate toast based on status
          if (data.status === 'preparing') {
            setToast({
              isVisible: true,
              title: 'Order Confirmed!',
              message:
                'Great news! Your order has been accepted and is now being prepared by the kitchen.',
              type: 'preparing',
            });
          } else if (data.status === 'completed') {
            setToast({
              isVisible: true,
              title: 'Order Ready!',
              message: 'Your order is now ready for pickup. Please collect it from the counter.',
              type: 'success',
            });
          }
        }
      };

      socket.on('order-status-updated', handleOrderStatusUpdate);

      return () => {
        socket.off('order-status-updated', handleOrderStatusUpdate);
      };
    }
  }, [orderId, socket, isConnected, joinOrder]);

  // No initial toast needed - user can see the status on screen

  const fetchOrder = async () => {
    try {
      console.log('🔍 Fetching order:', orderId);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        console.error('❌ Order fetch failed:', response.status, response.statusText);
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      console.log('✅ Order data received:', data);
      setOrder(data.order);
      setLoading(false);
    } catch (err) {
      console.error('❌ Order fetch error:', err);
      setLoading(false);
      // If order fetch fails, don't redirect automatically
      // Let the user see the error and handle it manually
    }
  };

  const formatPrice = (cents: number) => {
    const currency = order?.currency || 'INR';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
    } catch {
      return `₹${(cents / 100).toFixed(2)}`;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Waiting for Confirmation',
          description: 'Please wait while the restaurant reviews and confirms your order',
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-300',
          pulseColor: 'animate-pulse',
        };
      case 'preparing':
        return {
          label: 'Order Confirmed - Being Prepared',
          description: 'Great! Your order has been confirmed and is being prepared',
          icon: ChefHat,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-300',
          pulseColor: '',
        };
      case 'completed':
        return {
          label: 'Order Ready!',
          description: 'Your order is ready for pickup',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-300',
          pulseColor: '',
        };
      case 'cancelled':
        return {
          label: 'Order Cancelled',
          description: 'This order has been cancelled',
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-300',
          pulseColor: '',
        };
      default:
        return {
          label: 'Unknown Status',
          description: '',
          icon: AlertCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-300',
          pulseColor: '',
        };
    }
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-6xl">😕</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Order Not Found</h2>
          <p className="text-gray-600">The order you're looking for doesn't exist.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b bg-white">
          <div className="container mx-auto max-w-4xl px-4 py-6">
            <div className="flex items-center gap-4">
              <Link
                href={`/menu/${order.restaurant.slug}`}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              {order.restaurant.logo && (
                <Image
                  src={order.restaurant.logo}
                  alt={order.restaurant.name}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Status</h1>
                <p className="text-gray-600">
                  {order.restaurant.name} • #{order.orderNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto max-w-4xl px-4 py-8">
          {/* Status Card */}
          <div
            className={`mb-8 rounded-xl border-2 p-8 ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.pulseColor}`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`mb-4 rounded-full ${statusConfig.bgColor} p-4`}>
                <StatusIcon className={`h-16 w-16 ${statusConfig.color}`} />
              </div>
              <h2 className={`mb-2 text-3xl font-bold ${statusConfig.color}`}>
                {statusConfig.label}
              </h2>
              <p className="mb-4 text-lg text-gray-700">{statusConfig.description}</p>
              <p className="mb-4 text-sm text-gray-600">
                Ordered {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
              </p>

              {/* Order Confirmed Message & Actions */}
              {(order.status === 'preparing' || order.status === 'completed') && (
                <div className="mt-4 w-full max-w-md rounded-lg border border-white/50 bg-white/80 p-6 backdrop-blur-sm">
                  <p className="mb-4 font-medium text-gray-800">
                    {order.status === 'preparing'
                      ? '✅ You can now safely exit this page or order something else while you wait!'
                      : '🎉 Your order is ready for pickup! You can exit this page or place another order.'}
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                      href={`/menu/${order.restaurant.slug}`}
                      className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
                    >
                      {order.status === 'preparing' ? 'Order More Items' : 'Order Again'}
                    </Link>
                    {order.status === 'completed' && (
                      <button
                        onClick={() => window.print()}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                      >
                        Print Receipt
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Connection Status */}
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/50 px-3 py-2">
                <div
                  className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                ></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected - Live updates' : 'Reconnecting...'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Order Details */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Order Details</h3>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between border-b border-gray-100 pb-4 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.quantity}x {item.name}
                      </p>
                      {item.modifiers?.length > 0 && (
                        <p className="text-sm text-gray-600">
                          + {item.modifiers.map((m) => m.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(
                          (item.priceCents +
                            (item.modifiers?.reduce((sum, m) => sum + m.priceDelta, 0) || 0)) *
                            item.quantity
                        )}
                      </p>
                    </div>
                  </div>
                ))}

                {order.notes && (
                  <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                    <p className="text-sm font-medium text-gray-700">Special Instructions:</p>
                    <p className="text-gray-600">{order.notes}</p>
                  </div>
                )}

                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center justify-between text-2xl font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-indigo-600">{formatPrice(order.totalCents)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Customer Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-gray-900">{order.customerName}</p>
                </div>
                {order.customerEmail && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{order.customerEmail}</p>
                  </div>
                )}
                {order.customerPhone && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-gray-900">{order.customerPhone}</p>
                  </div>
                )}
                {order.tableNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Table Number</p>
                    <p className="text-gray-900">Table {order.tableNumber}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Important Notice for Pending Orders */}
          {order.status === 'pending' && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-6">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 animate-pulse text-amber-600" />
                <div>
                  <h4 className="font-semibold text-amber-900">
                    Please Wait - Do Not Close This Page
                  </h4>
                  <p className="text-amber-800">
                    Your order is being reviewed by the restaurant. You will receive a notification
                    when it's confirmed. Please keep this page open to receive real-time updates.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <OrderStatusToast
        isVisible={toast.isVisible}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />
    </>
  );
}
