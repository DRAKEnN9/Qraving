'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 1499,
    features: [
      'QR Menu (1 restaurant)',
      'Drag & drop menu builder',
      'Order management',
      'Email notifications',
      'Standard support',
    ],
  },
  {
    id: 'advance',
    name: 'Advance',
    price: 1999,
    features: [
      'Everything in Basic',
      'Analytics & reports',
      'Up to 3 restaurants',
      'Priority support',
      'Exportable CSV reports',
    ],
  },
] as const;

type PlanId = (typeof PLANS)[number]['id'];

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function SubscribePage() {
  const router = useRouter();
  const params = useSearchParams();
  const defaultPlan = (params.get('plan') as PlanId) || 'basic';

  const [plan, setPlan] = useState<PlanId>(defaultPlan);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Prefill user from /api/auth/me
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setName(d.user.name || '');
          setEmail(d.user.email || '');
        }
      })
      .catch(() => {});
  }, [router]);

  const selectedPlan = useMemo(() => PLANS.find((p) => p.id === plan)!, [plan]);

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
        body: JSON.stringify({ plan, name, email, contact }),
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
        handler: function () {
          toast.success('Trial started! You will be charged after 14 days');
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
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Choose your plan</h1>
        <p className="mb-8 text-gray-600">Start your 14-day free trial. Cancel anytime before the trial ends to avoid charges.</p>

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
                <span className="text-2xl font-extrabold text-gray-900">₹{p.price}</span>
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

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>Trial ends in 14 days. You can cancel any time before that and you won&apos;t be charged.</p>
          </div>
          <button
            onClick={startSubscription}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Starting trial…' : `Start ${selectedPlan.name} Trial`}
          </button>
        </div>
      </div>
    </div>
  );
}
