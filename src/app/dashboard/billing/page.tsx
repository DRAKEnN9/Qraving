'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CreditCard, CheckCircle, AlertCircle, Download, Zap, Star } from 'lucide-react';

interface Subscription {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'cancelled' | 'none';
  plan: 'basic' | 'advance';
  interval?: 'monthly' | 'yearly';
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

export const dynamic = 'force-dynamic';

export default function BillingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  // Manage plan, payment methods, and inline cancel modal removed per requirements
  const [catalogInterval, setCatalogInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [changePlanNotice, setChangePlanNotice] = useState<{
    plan: 'basic' | 'advance';
    interval: 'monthly' | 'yearly';
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Fetch status for both owners and admins (admins read-only), payments only for owners
    fetchBillingInfo();
  }, [router, authLoading, user?.role]);

  const fetchBillingInfo = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch subscription status
      const subResponse = await fetch('/api/billing/status?refresh=true', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (subResponse.ok) {
        const data = await subResponse.json();
        if (data.status !== 'none') {
          setSubscription(data);
        }
        if (data.interval) setCatalogInterval(data.interval);
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

  // Plan changes and inline cancel flow removed. Use dedicated cancellation page.

  const plans = [
    {
      id: 'basic',
      name: 'Essential',
      price: 1499,
      icon: Zap,
      features: [
        'QR Menu for 1 Restaurant',
        'Drag & drop menu builder',
        'Order management dashboard',
        'Real-time order notifications',
        'UPI payment integration',
        'Basic analytics & insights',
        'Email & chat support',
      ],
    },
    {
      id: 'advance',
      name: 'Professional',
      price: 1999,
      icon: Star,
      popular: true,
      features: [
        'Everything in Essential',
        'Advanced analytics & reports',
        'Peak time optimization',
        'Popular items tracking',
        'Exportable CSV reports',
        'Customer feedback system',
        'Priority support (24/7)',
        'Custom branding options',
        'Multi-language support',
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
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
              Billing & Subscription (Owner Access Only)
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              For security, billing details, invoices, and subscription changes are restricted to
              the account owner. Please contact the owner if you need assistance.
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className={`mb-8 ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Billing & Subscription
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <div
          className={`mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-emerald-100 p-3">
                  <Star className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold capitalize text-slate-900 dark:text-slate-100">
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
                        {subscription.cancelAtPeriodEnd ? 'Ends on ' : 'Renews on '}
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    {subscription.interval && (
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        • {subscription.interval === 'yearly' ? 'Yearly' : 'Monthly'} billing
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
              {subscription.cancelAtPeriodEnd && (
                <div className="mb-4 rounded-lg bg-yellow-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-700" />
                    <div>
                      <p className="font-medium text-yellow-900">Cancellation Scheduled</p>
                      <p className="text-sm text-yellow-700">
                        {subscription.currentPeriodEnd
                          ? `Your subscription will cancel on ${new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
                          : 'Your subscription will cancel at the end of the current billing period.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {subscription.status !== 'cancelled' && (
                <button
                  onClick={() => router.push('/dashboard/subscription/cancel')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 sm:w-auto"
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
        <div
          className={`mb-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}
        >
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 p-4">
              <AlertCircle className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
              No Active Subscription
            </h3>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Choose a plan below to get started
            </p>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className={`mb-8 ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}>
        <h2 className="mb-2 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
          Available Plans
        </h2>
        <div className="mb-4 flex items-center justify-center">
          <div className="inline-flex rounded-full bg-slate-100 p-1 text-xs font-semibold dark:bg-slate-800">
            <button
              onClick={() => setCatalogInterval('monthly')}
              className={`rounded-full px-3 py-1.5 ${catalogInterval === 'monthly' ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-200'}`}
              aria-pressed={catalogInterval === 'monthly'}
            >
              Monthly
            </button>
            <button
              onClick={() => setCatalogInterval('yearly')}
              className={`rounded-full px-3 py-1.5 ${catalogInterval === 'yearly' ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-200'}`}
              aria-pressed={catalogInterval === 'yearly'}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscription?.plan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 bg-white p-6 shadow-sm transition-all dark:bg-slate-900 ${
                  plan.popular
                    ? 'border-emerald-500 shadow-lg dark:border-emerald-400'
                    : isCurrentPlan
                      ? 'border-emerald-300 dark:border-emerald-400'
                      : 'border-slate-200 hover:border-emerald-300 dark:border-slate-700 dark:hover:border-emerald-400'
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
                  <div
                    className={`rounded-lg p-3 ${plan.popular ? 'bg-emerald-100' : 'bg-slate-100 dark:bg-slate-800'}`}
                  >
                    <Icon
                      className={`h-6 w-6 ${plan.popular ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}
                    />
                  </div>
                  {isCurrentPlan && (
                    <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <CheckCircle className="h-3 w-3" />
                      Current
                    </div>
                  )}
                </div>

                <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                    ₹
                    {catalogInterval === 'yearly'
                      ? plan.id === 'advance'
                        ? 19990
                        : 14990
                      : plan.price}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    /{catalogInterval === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>

                <ul className="mb-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full cursor-not-allowed rounded-lg bg-slate-100 px-4 py-3 font-medium text-slate-400"
                    title="Current plan"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setChangePlanNotice({
                        plan: plan.id as 'basic' | 'advance',
                        interval: catalogInterval,
                      })
                    }
                    className={`w-full rounded-lg px-4 py-3 font-medium transition-colors ${
                      plan.popular
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'border border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    Change Plan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method section removed per requirements */}

      {/* Payment History */}
      <div
        className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}
      >
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Payment History</h2>
        {paymentLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-600"></div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              Loading payment history...
            </p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 p-4">
              <CreditCard className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400">No payment history yet</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Payments will appear here once you subscribe
            </p>
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
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${payment.status === 'captured' ? 'bg-green-100 text-green-700' : payment.status === 'authorized' ? 'bg-blue-100 text-blue-700' : payment.status === 'created' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}
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
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Plan Modal */}
      {changePlanNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-amber-300 bg-white p-6 shadow-2xl dark:border-amber-900 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/40">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Change Plan</h3>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              To switch to{' '}
              <span className="font-semibold capitalize">
                {changePlanNotice.plan === 'advance' ? 'Professional' : 'Essential'}
              </span>{' '}
              ({changePlanNotice.interval}), please cancel your ongoing subscription first. You can
              schedule cancellation at the end of the current billing period to avoid double
              charges.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setChangePlanNotice(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => router.push('/dashboard/subscription/cancel')}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Go to Cancel Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
