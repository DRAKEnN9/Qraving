'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, User } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { generateUPILink, isUPISupported, formatUPIAmount } from '@/lib/upiPayment';

interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  tableNumber?: number;
  currency?: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { items, getTotalPrice, clearCart, tableNumber, setTableNumber } = useCart();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  // Payment state
  const [paymentOption, setPaymentOption] = useState<'upi' | 'cash'>('upi');
  const [upiLink, setUpiLink] = useState<string>('');
  const [upiQR, setUpiQR] = useState<string>('');
  const [showUpiModal, setShowUpiModal] = useState(false);

  // Check cart and initialize
  useEffect(() => {
    // Small delay to ensure localStorage is loaded in CartContext
    const timer = setTimeout(() => {
      console.log('Checkout initialized with', items.length, 'items');
      setIsInitialized(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [items]);

  // Redirect if cart becomes empty after initialization
  useEffect(() => {
    if (isInitialized && items.length === 0) {
      console.log('Cart is empty, redirecting...');
      toast.error('Your cart is empty');
      router.push(`/menu/${slug}`);
    }
  }, [isInitialized, items.length, slug, router]);

  useEffect(() => {
    if (isInitialized && items.length > 0) {
      fetchRestaurant();
    }
  }, [slug, isInitialized]);

  const fetchRestaurant = async () => {
    try {
      console.log('Fetching restaurant:', slug);
      const response = await fetch(`/api/menu/${slug}`);
      if (!response.ok) throw new Error('Failed to fetch restaurant');

      const data = await response.json();
      console.log('Restaurant data:', data.restaurant);
      setRestaurant(data.restaurant);
      // Default to Pay Later (cash)
      setPaymentOption('cash');
    } catch (err) {
      console.error('Fetch restaurant error:', err);
      toast.error('Failed to load restaurant details');
    }
  };

  const formatPrice = (cents: number) => {
    const currency = restaurant?.currency || 'INR';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
    } catch {
      // Fallback if currency code is invalid
      return `₹${(cents / 100).toFixed(2)}`;
    }
  };

  const handlePlaceOrder = async () => {
    if (!customerName) {
      toast.error('Please enter your name');
      return;
    }

    if (!tableNumber) {
      toast.error('Please enter your table number');
      return;
    }

    if (!restaurant) return;

    setLoading(true);
    console.log('===== PLACING ORDER =====');
    console.log('Restaurant:', restaurant.name);
    console.log('Total Amount:', getTotalPrice());

    try {
      // Create order with selected payment option
      console.log('Creating order...');
      const orderResponse = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId: restaurant._id,
          customerName,
          tableNumber,
          notes,
          paymentMethod: paymentOption,
          paymentStatus: 'pending',
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            priceCents: item.priceCents,
            quantity: item.quantity,
            modifiers: item.modifiers || [],
          })),
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();
      console.log('✅ Order created successfully!');
      console.log('Order ID:', orderData.orderId);
      console.log('Order Number:', orderData.orderNumber);

      // Clear cart and redirect to order waiting screen  
      clearCart();
      
      const redirectUrl = `/order-waiting/${orderData.orderId}?success=true&payment=cash`;
      console.log('🚀 About to redirect to:', redirectUrl);
      console.log('Current location:', window.location.href);
      
      // Try window.location as a more reliable redirect
      window.location.href = redirectUrl;
    } catch (err: any) {
      console.error('Order error:', err);
      toast.error(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-24 sm:pb-0">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-center gap-4">
            {restaurant.logo && (
              <Image
                src={restaurant.logo}
                alt={restaurant.name}
                width={48}
                height={48}
                className="rounded-lg"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              <p className="text-gray-600">{restaurant.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Customer Information */}
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                  <User className="h-5 w-5" />
                  Customer Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                      Table Number <span className="text-red-500">*</span>
                      {restaurant.tableNumber && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Max: {restaurant.tableNumber})
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={tableNumber || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (restaurant.tableNumber && value > restaurant.tableNumber) {
                          toast.error(`Table number cannot exceed ${restaurant.tableNumber}`);
                          return;
                        }
                        setTableNumber(e.target.value ? value : null);
                      }}
                      min="1"
                      max={restaurant.tableNumber || undefined}
                      placeholder="5"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Special Instructions</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                />
              </div>
              {/* Payment */}
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-gray-900">Payment</h2>
                <div className="space-y-3">
                  <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${paymentOption === 'cash' ? 'border-indigo-600 bg-indigo-50/40' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="paymentOption"
                      className="mt-1"
                      checked={paymentOption === 'cash'}
                      onChange={() => setPaymentOption('cash')}
                    />
                    <div>
                      <p className="font-medium text-gray-900">Pay at Counter (Pay Later)</p>
                      <p className="text-sm text-gray-600">Place order now and pay when you receive your food.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                <ShoppingCart className="h-5 w-5" />
                Order Summary
              </h2>

              {/* Items */}
              <div className="mb-4 space-y-3 border-b pb-4">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    {item.image && (
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.quantity}x {item.name}
                      </h4>
                      {item.modifiers.length > 0 && (
                        <p className="text-sm text-gray-600">
                          + {item.modifiers.map((m) => m.name).join(', ')}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(
                          (item.priceCents +
                            item.modifiers.reduce((sum, m) => sum + m.priceDelta, 0)) *
                            item.quantity
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-4 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-indigo-600">{formatPrice(getTotalPrice())}</span>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading || !customerName || !tableNumber}
                className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Processing...
                  </div>
                ) : (
                  paymentOption === 'upi' ? 'Pay & Place Order' : 'Place Order (Pay Later)'
                )}
              </button>

              <p className="mt-4 text-center text-xs text-gray-500">
                By placing your order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
    </div>
    {/* Mobile Action Bar */}
    <div className="fixed inset-x-0 bottom-0 border-t bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] sm:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-semibold text-indigo-600">{formatPrice(getTotalPrice())}</p>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={loading || !customerName || !tableNumber}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : (paymentOption === 'upi' ? 'Pay & Place Order' : 'Place Order (Pay Later)')}
        </button>
      </div>
    </div>
  </div>
  {/* UPI Modal */}
  {showUpiModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowUpiModal(false)}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Complete Payment via UPI</h3>
        <p className="mb-4 text-sm text-gray-600">Use your UPI app to complete the payment. If the app didn't open automatically, tap the button below or scan the QR code.</p>
        <div className="mb-4 space-y-3">
          <a
            href={upiLink}
            className="block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700"
          >
            Open in UPI App
          </a>
          <button
            onClick={async () => {
              try { await navigator.clipboard?.writeText(upiLink); toast.success('UPI link copied'); } catch {}
            }}
            className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Copy Payment Link
          </button>
        </div>
        {upiQR && (
          <div className="mb-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={upiQR} alt="UPI QR" className="h-48 w-48 rounded-lg border" />
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={() => setShowUpiModal(false)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}
</>
);
}
