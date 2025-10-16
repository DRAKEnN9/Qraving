'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Download,
  ExternalLink,
  Zap,
  Star,
  Crown,
} from 'lucide-react';

interface Subscription {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'cancelled' | 'none';
  plan: 'basic' | 'advance';
  currentPeriodEnd?: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd?: boolean;
}

interface Payment {
  _id: string;
  razorpayPaymentId?: string;
  razorpayInvoiceId?: string;
  amount: number;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  paidAt?: string;
  createdAt: string;
  invoiceUrl?: string;
}

export default function BillingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    // Fetch status for both owners and admins (admins read-only), payments only for owners
    fetchBillingInfo();
  }, [router, authLoading, user?.role]);

  const fetchBillingInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch subscription status
      const subResponse = await fetch('/api/billing/status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (subResponse.ok) {
        const data = await subResponse.json();
        if (data.status !== 'none') {
          setSubscription(data);
        }
      }
      
      setLoading(false);

      // Fetch payment history (account-level owner only)
      if (user?.accountRole === 'owner') {
        setPaymentLoading(true);
        const paymentResponse = await fetch('/api/billing/payments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (paymentResponse.ok) {
          const paymentData = await paymentResponse.json();
          setPayments(paymentData.payments || []);
        }
        setPaymentLoading(false);
      } else {
        // Managers don't fetch payments
        setPayments([]);
        setPaymentLoading(false);
      }
    } catch (err) {
      console.error('Failed to fetch billing info:', err);
      setLoading(false);
      setPaymentLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentPassword) {
      setActionError('Please enter your password');
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to cancel');

      setShowCancelModal(false);
      setCurrentPassword('');
      // Refresh billing info
      fetchBillingInfo();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePlan = async (newPlan: 'basic' | 'advance') => {
    if (!currentPassword) {
      setActionError('Please enter your password');
      return;
    }

    setActionLoading(true);
    setActionError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: newPlan,
          currentPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change plan');

      setShowManageModal(false);
      setCurrentPassword('');
      // Refresh billing info
      fetchBillingInfo();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 1499,
      icon: Zap,
      features: [
        'QR Menu for 1 Restaurant',
        'Drag & drop menu builder',
        'Order management dashboard',
        'Email notifications',
        'UPI payment integration',
        'Basic support (Email)',
      ],
    },
    {
      id: 'advance',
      name: 'Advance',
      price: 1999,
      icon: Star,
      popular: true,
      features: [
        'Everything in Basic',
        'Up to 3 Restaurants',
        'Analytics & Reports',
        'Peak time reports',
        'Popular items tracking',
        'Exportable CSV reports',
        'Priority support (Chat)',
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <CreditCard className="mx-auto h-12 w-12 animate-pulse text-emerald-600" />
          <p className="mt-4 text-gray-600 dark:text-slate-400">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const effectiveAccountRole = user?.accountRole || (user?.role === 'owner' ? 'owner' : 'admin');
  const blocked = effectiveAccountRole !== 'owner';

  return (
    <div className="relative">
      {blocked && (
        <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-lg rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CreditCard className="h-5 w-5" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">Billing & Subscription (Owner Access Only)</h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              For security, billing details, invoices, and subscription changes are restricted to the
              account owner. Please contact the owner if you need assistance.
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className={`mb-8 ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Billing & Subscription</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Manage your subscription and billing information</p>
      </div>

      {/* Current Subscription */}
      {subscription && (
      <div className={`mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-3">
                <Star className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 capitalize">
                  {subscription.plan} Plan
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      subscription.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : subscription.status === 'trialing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {subscription.status === 'active'
                      ? 'Active'
                      : subscription.status === 'trialing'
                      ? 'Trial'
                      : 'Inactive'}
                  </div>
                  {subscription.currentPeriodEnd && (
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Renews on{' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {subscription.status === 'trialing' && subscription.trialEndsAt && (
              <div className="mb-4 rounded-lg bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Trial Period</p>
                    <p className="text-sm text-blue-700">
                      Your trial ends on{' '}
                      {new Date(subscription.trialEndsAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      . Add a payment method to continue after trial.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              onClick={() => setShowManageModal(true)}
              className="w-full sm:w-auto rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Manage Plan
            </button>
            {subscription.status !== 'cancelled' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      </div>
      )}
      
      {/* No Subscription State */}
      {!subscription && (
        <div className={`mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}>
          <div className="text-center py-8">
            <div className="mb-4 rounded-full bg-slate-100 p-4 w-16 h-16 mx-auto flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No Active Subscription</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Choose a plan below to get started</p>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className={`mb-8 ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}>
        <h2 className="mb-4 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">Available Plans</h2>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscription?.plan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 bg-white p-6 shadow-sm transition-all dark:bg-slate-900 ${
                  plan.popular
                    ? 'border-emerald-500 shadow-lg'
                    : isCurrentPlan
                    ? 'border-emerald-300'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <div className="mb-4 flex items-center justify-between">
                  <div className={`rounded-lg p-3 ${plan.popular ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    <Icon className={`h-6 w-6 ${plan.popular ? 'text-emerald-600' : 'text-slate-600'}`} />
                  </div>
                  {isCurrentPlan && (
                    <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      <CheckCircle className="h-3 w-3" />
                      Current
                    </div>
                  )}
                </div>

                <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">₹{plan.price}</span>
                  <span className="text-slate-600 dark:text-slate-400">/month</span>
                </div>

                <ul className="mb-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrentPlan}
                  className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${
                    isCurrentPlan
                      ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                      : plan.popular
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'border border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method - Only show if subscription exists */}
      {subscription && subscription.status !== 'trialing' && (
      <div className={`mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}>
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">Payment Method</h2>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="rounded-lg bg-slate-100 p-3">
              <CreditCard className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Payment method managed via Razorpay</p>
              <button 
                onClick={() => window.open('https://razorpay.com', '_blank')}
                className="mt-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                Manage Payment Methods →
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Payment History */}
      <div className={`rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Payment History</h2>
        
        {paymentLoading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Loading payment history...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4 w-16 h-16 mx-auto flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">No payment history yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Payments will appear here once you subscribe</p>
          </div>
        ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Payment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {payment.razorpayPaymentId || payment._id.substring(0, 12) + '...'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(payment.paidAt || payment.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                    ₹{(payment.amount / 100).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        payment.status === 'captured'
                          ? 'bg-green-100 text-green-700'
                          : payment.status === 'authorized'
                          ? 'bg-blue-100 text-blue-700'
                          : payment.status === 'created'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    {payment.invoiceUrl ? (
                      <a
                        href={payment.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Manage Plan Modal */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="mb-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Manage Subscription</h3>
            
            {actionError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700">
                {actionError}
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Current Plan: <strong className="text-slate-900 dark:text-slate-100 capitalize">{subscription?.plan}</strong>
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const isCurrent = subscription?.plan === plan.id;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-xl border-2 p-4 ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${isCurrent ? 'text-emerald-600' : 'text-slate-600'}`} />
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">{plan.name}</h4>
                        </div>
                        {isCurrent && (
                          <span className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mb-3 text-2xl font-bold text-slate-900 dark:text-slate-100">₹{plan.price}/mo</p>
                      <ul className="mb-4 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            if (!currentPassword) {
                              setActionError('Please enter your password below first');
                            } else {
                              handleChangePlan(plan.id as 'basic' | 'advance');
                            }
                          }}
                          disabled={actionLoading}
                          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {actionLoading ? 'Processing...' : 'Switch to ' + plan.name}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Enter your password to confirm plan change
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setActionError('');
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Your current password"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setCurrentPassword('');
                  setActionError('');
                }}
                disabled={actionLoading}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Cancel Subscription</h3>
            </div>

            {actionError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
                {actionError}
              </div>
            )}

            <p className="mb-4 text-slate-600 dark:text-slate-400">
              Are you sure you want to cancel your subscription? You will lose access to all premium
              features immediately.
            </p>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Enter your password to confirm cancellation
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setActionError('');
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Your current password"
                autoFocus
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCurrentPassword('');
                  setActionError('');
                }}
                disabled={actionLoading}
                className="w-full sm:w-auto rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={actionLoading || !currentPassword}
                className="w-full sm:w-auto rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
