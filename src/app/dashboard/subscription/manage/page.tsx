"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type Status = 'none' | 'trialing' | 'active' | 'cancelled' | 'past_due' | 'incomplete' | 'halted' | 'pending';

export const dynamic = 'force-dynamic';

export default function ManageSubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>('none');
  const [plan, setPlan] = useState<'basic' | 'advance'>('basic');
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(true);

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
        if (d.interval) setInterval(d.interval);
        if (d.trialEndsAt) setTrialEndsAt(d.trialEndsAt);
        if (d.currentPeriodEnd) setCurrentPeriodEnd(d.currentPeriodEnd);
        if (typeof d.cancelAtPeriodEnd === 'boolean') setCancelAtPeriodEnd(!!d.cancelAtPeriodEnd);
      })
      .catch(e => setError(e.message || 'Failed to load subscription'))
      .finally(() => setLoading(false));
  }, [router, authLoading, user?.role]);

  // Plan changes are disabled per requirements. Only cancellation is available via dedicated page.

  const blocked = user?.accountRole !== 'owner';

  useEffect(() => {
    if (blocked) setLoading(false);
  }, [blocked]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

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
        {searchParams.get('cancel') === 'success' && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300">
            Subscription cancellation received. {cancelAtPeriodEnd ? 'You will retain access until the end of your current billing period.' : 'Access to premium features has been removed immediately.'}
          </div>
        )}
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
            <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Billing:</span> {interval}</p>
            {trialEndsAt && (
              <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Trial ends:</span> {new Date(trialEndsAt).toLocaleString()}</p>
            )}
            {currentPeriodEnd && (
              <p className="text-sm text-slate-700 dark:text-slate-300"><span className="font-semibold">Current period ends:</span> {new Date(currentPeriodEnd).toLocaleString()}</p>
            )}
            {cancelAtPeriodEnd && (
              <div className="mt-3 rounded-lg bg-yellow-50 p-3 text-yellow-800 text-sm">
                Cancellation scheduled at period end.
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {(status === 'active' || status === 'trialing') && (
                <button
                  onClick={() => router.push('/dashboard/subscription/cancel')}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          {/* Plans management removed per requirements */}
        </div>

        {/* Password modal removed; cancellation handled on dedicated page */}
      </div>
    </div>
  );
}
