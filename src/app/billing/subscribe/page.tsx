'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'basic',
    name: 'Essential',
    price: 1499,
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
] as const;

type PlanId = (typeof PLANS)[number]['id'];

declare global {
  interface Window {
    Razorpay: any;
  }
}

function SubscribePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  // Default to yearly advance plan for new signups
  const defaultPlan = (params.get('plan') as PlanId) || 'advance';
  const defaultInterval = (params.get('interval') === 'yearly' ? 'yearly' : params.get('interval') === 'monthly' ? 'monthly' : 'yearly') as 'monthly' | 'yearly';
  const reason = params.get('reason'); // Check why user was redirected here

  const [plan, setPlan] = useState<PlanId>(defaultPlan);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>(defaultInterval);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null);
  const [trialMessage, setTrialMessage] = useState<string>('');

  useEffect(() => {
    // Prefill user from /api/auth/me
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Fetch user data and trial eligibility
    Promise.all([
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/billing/trial-eligibility', { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(([userRes, trialRes]) => Promise.all([userRes.json(), trialRes.json()]))
      .then(([userData, trialData]) => {
        if (userData?.user) {
          setName(userData.user.name || '');
          setEmail(userData.user.email || '');
        }
        if (trialData?.success) {
          setTrialEligible(trialData.isEligible);
          setTrialMessage(trialData.message);
        }
      })
      .catch(() => {
        setTrialEligible(false);
        setTrialMessage('Unable to check trial eligibility');
      });
  }, [router]);

  const selectedPlan = useMemo(() => PLANS.find((p) => p.id === plan)!, [plan]);
  const displayPrice = (p: PlanId) => (interval === 'yearly' ? (p === 'advance' ? 19999 : 14999) : (p === 'advance' ? 1999 : 1499));

  const startSubscription = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan, interval, name, email, contact, skipTrial: trialEligible === false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate subscription');

      const options = {
        key: data.keyId,
        subscription_id: data.checkout.subscription_id,
        name: data.checkout.name,
        description: data.checkout.description,
        prefill: data.checkout.prefill,
        notes: data.checkout.notes,
        theme: { color: '#4F46E5' },
        modal: { ondismiss: () => toast('Subscription flow cancelled') },
        handler: async function () {
          if (data.hasTrial) {
            toast.success('Trial started! You will be charged after 14 days');
          } else {
            toast.success('Subscription started! Payment processed.');
          }
          // Try to sync subscription status (non-blocking)
          fetch('/api/billing/sync', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(res => res.json())
            .then(data => console.log('Subscription synced:', data))
            .catch(e => console.warn('Sync failed (non-critical):', e));
          
          // Also refresh status as backup (non-blocking)
          fetch('/api/billing/status?refresh=true', {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(() => console.log('Status refreshed'))
            .catch(e => console.warn('Refresh failed (non-critical):', e));
          router.push('/dashboard');
        },
      };

      if (!window.Razorpay) {
        toast.error('Razorpay not loaded');
        return;
      }

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e: any) {
      toast.error(e.message || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Show message if user was redirected due to no subscription */}
        {reason === 'no_subscription' && (
          <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Subscription Required
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your account doesn't have an active subscription. Please subscribe to access the dashboard and start managing your restaurant.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Choose your plan</h1>
        
        {/* Trial eligibility messaging */}
        {trialEligible === true && (
          <p className="mb-8 text-gray-600">
            <span className="font-semibold text-green-600">🎉 You're eligible for a 14-day free trial!</span> 
            Cancel anytime before the trial ends to avoid charges.
          </p>
        )}
        {trialEligible === false && (
          <div className="mb-8">
            <p className="text-gray-600 mb-3">
              <span className="font-semibold text-orange-600">⚡ Start your subscription today!</span>
            </p>
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-800">
                    Free trial already used
                  </p>
                  <p className="mt-1 text-sm text-orange-700">
                    {trialMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {trialEligible === null && (
          <p className="mb-8 text-gray-600">Loading subscription options...</p>
        )}

        {/* Billing interval toggle */}
        <div className="mb-8 inline-flex rounded-full bg-gray-100 p-1 text-sm font-semibold" role="tablist" aria-label="Billing Interval">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-4 py-2 rounded-full ${interval === 'monthly' ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}
            aria-pressed={interval === 'monthly'}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-4 py-2 rounded-full ${interval === 'yearly' ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}
            aria-pressed={interval === 'yearly'}
          >
            Yearly <span className="ml-1 text-xs font-bold">(2 months free)</span>
          </button>
        </div>

        {/* Plan selector */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              className={`rounded-xl border-2 bg-white p-6 text-left transition-all ${
                plan === p.id ? 'border-indigo-600 shadow-lg' : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-pressed={plan === p.id}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">{p.name}</h3>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-extrabold text-gray-900">₹{displayPrice(p.id)}</span>
                  <span className="text-gray-500 text-sm">/ {interval === 'yearly' ? 'year' : 'month'}</span>
                  {interval === 'yearly' && (
                    <span className="mb-0.5 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">2 months free</span>
                  )}
                </div>
              </div>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Details form */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Billing details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="9876543210"
                type="tel"
              />
            </div>
          </div>
        </div>

        <div className="mb-6 text-center text-xs text-gray-500">
          By subscribing, you agree to our{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline">
            Terms of Service
          </a>
          ,{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline">
            Privacy Policy
          </a>
          , and{' '}
          <a href="/refund" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline">
            Refund Policy
          </a>
          .
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {trialEligible === true && (
              <p>Trial ends in 14 days. You can cancel any time before that and you won&apos;t be charged.</p>
            )}
            {trialEligible === false && (
              <p>Payment will be processed immediately. Your subscription starts today.</p>
            )}
            {trialEligible === null && (
              <p>Loading...</p>
            )}
          </div>
          <button
            onClick={startSubscription}
            disabled={loading || trialEligible === null}
            className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? (trialEligible ? 'Starting trial…' : 'Processing payment…') : 
             trialEligible ? `Start ${selectedPlan.name} Trial` : 
             trialEligible === false ? `Subscribe to ${selectedPlan.name}` : 'Loading...'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function SubscribePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SubscribePageContent />
    </Suspense>
  );
}
