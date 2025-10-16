'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Clock, ChefHat, MapPin, User, Mail, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import QRCode from 'qrcode';
import { generateUPILink, formatUPIAmount } from '@/lib/upiPayment';
import toast from 'react-hot-toast';

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

const statusConfig = {
  pending: {
    label: 'Order Received',
    description: 'Your order has been received and is waiting to be prepared',
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  preparing: {
    label: 'Preparing',
    description: 'Your order is being prepared by our kitchen',
    icon: ChefHat,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  
  completed: {
    label: 'Completed',
    description: 'Your order has been completed. Thank you!',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This order has been cancelled',
    icon: CheckCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

export default function OrderConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params?.orderId as string;
  const success = searchParams?.get('success') === 'true';
  const paymentMethod = searchParams?.get('payment');
  const isUPICheckout = paymentMethod === 'upi';

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [upiLink, setUpiLink] = useState<string>('');
  const [upiQR, setUpiQR] = useState<string>('');
  const [hasUPI, setHasUPI] = useState<boolean>(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();

      // Poll for status updates every 10 seconds
      const interval = setInterval(fetchOrder, 10000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order');

      const data = await response.json();
      setOrder(data.order);
      setLoading(false);

      // When order loads and this is a UPI checkout, fetch restaurant UPI details and prepare link/QR
      if (data?.order?.restaurant?.slug && isUPICheckout) {
        try {
          const restRes = await fetch(`/api/menu/${data.order.restaurant.slug}`);
          const restJson = await restRes.json();
          const upiId: string | undefined = restJson?.restaurant?.paymentInfo?.upiId;
          const payeeName: string = restJson?.restaurant?.paymentInfo?.accountHolderName || restJson?.restaurant?.name || 'Restaurant';
          if (upiId) {
            setHasUPI(true);
            const link = generateUPILink({
              upiId,
              payeeName,
              amount: formatUPIAmount(data.order.totalCents),
              transactionNote: `Order #${data.order.orderNumber} at ${restJson?.restaurant?.name || 'Restaurant'}`,
              transactionRef: String(data.order._id),
            });
            setUpiLink(link);
            try {
              const dataUrl = await QRCode.toDataURL(link);
              setUpiQR(dataUrl);
            } catch {}
          } else {
            setHasUPI(false);
          }
        } catch (e) {
          setHasUPI(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
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
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Banner */}
      {success && (
        <div className="border-b border-green-200 bg-green-50">
          <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-green-900">Order Placed Successfully!</h1>
                <p className="text-green-700">
                  {paymentMethod === 'cash'
                    ? 'Please pay at the counter when you receive your order.'
                    : hasUPI
                      ? 'Complete the payment using your UPI app to confirm your order.'
                      : 'Online payment option is currently unavailable; the restaurant will confirm your order.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-4">
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
              <h2 className="text-2xl font-bold text-gray-900">{order.restaurant.name}</h2>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Status Card */}
        <div className={`mb-8 rounded-lg border-2 p-8 ${status.bgColor}`}>
          <div className="flex flex-col items-center text-center">
            <div className={`mb-4 rounded-full ${status.bgColor} p-4`}>
              <StatusIcon className={`h-16 w-16 ${status.color}`} />
            </div>
            <h2 className={`mb-2 text-3xl font-bold ${status.color}`}>{status.label}</h2>
            <p className="mb-4 text-lg text-gray-700">{status.description}</p>
            <p className="text-sm text-gray-600">
              Ordered {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Customer Information */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
              <User className="h-5 w-5" />
              Customer Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <User className="h-5 w-5 text-gray-400" />
                <span>{order.customerName}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="h-5 w-5 text-gray-400" />
                <span>{order.customerEmail}</span>
              </div>
              {order.customerPhone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span>{order.customerPhone}</span>
                </div>
              )}
              {order.tableNumber && (
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span>Table {order.tableNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Progress */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Order Progress</h3>
            <div className="space-y-4">
              {/* Pending */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    order.status === 'pending' || order.status === 'preparing' || order.status === 'completed'
                      ? 'bg-green-600'
                      : 'bg-gray-300'
                  }`}
                >
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Order Received</p>
                  <p className="text-sm text-gray-600">We've got your order</p>
                </div>
              </div>

              {/* Preparing */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    order.status === 'preparing' || order.status === 'completed'
                      ? 'bg-green-600'
                      : order.status === 'pending'
                      ? 'bg-yellow-400 animate-pulse'
                      : 'bg-gray-300'
                  }`}
                >
                  <ChefHat className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Preparing</p>
                  <p className="text-sm text-gray-600">Kitchen is working on it</p>
                </div>
              </div>

              {/* Completed */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    order.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Completed</p>
                  <p className="text-sm text-gray-600">Enjoy your meal!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-xl font-bold text-gray-900">Order Details</h3>
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between border-b border-gray-100 pb-4 last:border-0">
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
                  <p className="text-sm text-gray-600">{formatPrice(item.priceCents)} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm font-medium text-gray-700">Special Instructions:</p>
              <p className="text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Total */}
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between text-2xl font-bold">
              <span className="text-gray-900">Total</span>
              <span className="text-indigo-600">{formatPrice(order.totalCents)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href={`/menu/${order.restaurant.slug}`}
            className="flex-1 rounded-lg border-2 border-indigo-600 bg-white px-6 py-3 text-center font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            Order Again
          </Link>
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            Print Receipt
          </button>
        </div>

        {/* UPI Payment Actions (if applicable) */}
        {isUPICheckout && hasUPI && (
          <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-bold text-gray-900">Complete Payment</h3>
            <p className="mb-4 text-sm text-gray-600">Open your UPI app or scan the QR to pay. Once paid, the restaurant will confirm your order.</p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={upiLink}
                className="w-full sm:w-auto rounded-lg bg-indigo-600 px-6 py-3 text-center font-medium text-white hover:bg-indigo-700"
              >
                Open in UPI App
              </a>
              <button
                onClick={async () => { try { await navigator.clipboard?.writeText(upiLink); toast.success('UPI link copied'); } catch {} }}
                className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Copy UPI Link
              </button>
            </div>
            {upiQR && (
              <div className="mt-6 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={upiQR} alt="UPI QR" className="h-48 w-48 rounded-lg border" />
              </div>
            )}
          </div>
        )}

        {/* Auto-refresh Notice */}
        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-center text-sm text-blue-700">
              🔄 This page updates automatically. You'll see status changes as they happen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
