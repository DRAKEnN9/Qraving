"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Status = 'none' | 'trialing' | 'active' | 'cancelled' | 'past_due' | 'incomplete' | 'halted' | 'pending';

export default function ManageSubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>('none');
  const [plan, setPlan] = useState<'basic' | 'advance'>('basic');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    // Fetch status for both owners and admins (admins read-only via effective owner)
    fetch('/api/billing/status', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setStatus(d.status || 'none');
        if (d.plan) setPlan(d.plan);
        if (d.trialEndsAt) setTrialEndsAt(d.trialEndsAt);
        if (d.currentPeriodEnd) setCurrentPeriodEnd(d.currentPeriodEnd);
      })
      .catch(e => setError(e.message || 'Failed to load subscription'))
      .finally(() => setLoading(false));
  }, [router, authLoading, user?.role]);

  const cancelNow = async () => {
    if (!currentPassword) {
      setError('Please enter your current password to cancel subscription');
      return;
    }
    
    try {
      setCanceling(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/billing/cancel', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ currentPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      setShowPasswordPrompt(null);
      setCurrentPassword('');
      // Refresh status
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCanceling(false);
    }
  };

  const changePlan = (targetPlan: 'basic' | 'advance') => {
    // Check if this is an existing subscription change that requires password
    if (status === 'active' || status === 'trialing') {
      setShowPasswordPrompt(`change-${targetPlan}`);
    } else {
      // New subscription, no password needed
      router.push(`/billing/subscribe?plan=${targetPlan}`);
    }
  };
  
  const confirmPlanChange = async () => {
    if (!currentPassword || !showPasswordPrompt?.startsWith('change-')) {
      setError('Please enter your current password to change plans');
      return;
    }
    
    const targetPlan = showPasswordPrompt.replace('change-', '') as 'basic' | 'advance';
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          plan: targetPlan,
          currentPassword 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change plan');
      
      // Redirect to checkout or show success
      if (data.checkout) {
        // Handle Razorpay checkout flow
        window.location.href = `/billing/checkout?subscriptionId=${data.subscriptionId}`;
      } else {
        setShowPasswordPrompt(null);
        setCurrentPassword('');
        router.refresh();
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  const blocked = user?.accountRole !== 'owner';

  useEffect(() => {
    if (blocked) setLoading(false);
  }, [blocked]);

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950">
      {blocked && (
        <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-lg rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">Subscription Management (Owner Access Only)</h2>
            <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">For security, subscription changes are restricted to the account owner.</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Please contact the owner if you need assistance.</p>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Manage Subscription</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Switch plans, check billing cycle, or cancel</p>
        </div>

        {error && <div className={`mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}>{error}</div>}

        <div className={`grid gap-6 md:grid-cols-2 ${blocked ? 'pointer-events-none select-none blur-sm' : ''}`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Current Status</h2>
            <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Status:</span> {status}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Plan:</span> {plan}</p>
            {trialEndsAt && (
              <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Trial ends:</span> {new Date(trialEndsAt).toLocaleString()}</p>
            )}
            {currentPeriodEnd && (
              <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Current period ends:</span> {new Date(currentPeriodEnd).toLocaleString()}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => changePlan(plan === 'basic' ? 'advance' : 'basic')}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                {plan === 'basic' ? 'Upgrade to Advance' : 'Downgrade to Basic'}
              </button>
              {(status === 'active' || status === 'trialing') && (
                <button
                  onClick={() => setShowPasswordPrompt('cancel')}
                  disabled={canceling}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-700 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Plans</h2>
            <div className="grid gap-4">
              <div className={`rounded-xl border p-4 ${plan === 'basic' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Basic</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">₹1,499 / month</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">1 Restaurant</p>
                  </div>
                  <button onClick={() => changePlan('basic')} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50">Select</button>
                </div>
              </div>
              <div className={`rounded-xl border p-4 ${plan === 'advance' ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Advance</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">₹1,999 / month</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Up to 3 Restaurants</p>
                  </div>
                  <button onClick={() => changePlan('advance')} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50">Select</button>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Note: Switching plans will open the checkout flow. Existing subscriptions may be cancelled and recreated depending on provider constraints.</p>
          </div>
        </div>

        {/* Password Confirmation Modal */}
        {showPasswordPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {showPasswordPrompt === 'cancel' ? 'Cancel Subscription' : 'Change Plan'}
              </h3>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Please enter your current password to confirm this sensitive operation.
              </p>
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Enter your current password"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPasswordPrompt(null);
                    setCurrentPassword('');
                    setError('');
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={showPasswordPrompt === 'cancel' ? cancelNow : confirmPlanChange}
                  disabled={!currentPassword || canceling}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {canceling ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
