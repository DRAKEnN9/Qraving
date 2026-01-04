'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const dynamic = 'force-dynamic';

type Status =
  | 'none'
  | 'trialing'
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'incomplete'
  | 'halted'
  | 'pending';

type Plan = 'basic' | 'advance';

export default function CancelSubscriptionPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState<Status>('none');
  const [plan, setPlan] = useState<Plan>('basic');
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);

  const [atPeriodEnd, setAtPeriodEnd] = useState(true);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/billing/status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Failed to load subscription');
        setStatus(d.status || 'none');
        setPlan((d.plan as Plan) || 'basic');
        setInterval((d.interval as any) || 'monthly');
        if (d.currentPeriodEnd) setCurrentPeriodEnd(d.currentPeriodEnd);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, router]);

  const reasons = useMemo(
    () => [
      'Missing features',
      'Switching service',
      'Not using it',
      'Billing or payment issues',
      'Technical issues/bugs',
      'QR code issues',
      'Customer support',
      'Other',
    ],
    []
  );

  const canSubmit = reason.trim().length > 0 && !submitting && status !== 'none';

  const startCancel = () => {
    setError('');
    if (!reason.trim()) {
      setError('Please select a reason for cancellation');
      return;
    }
    setShowConfirm(true);
  };

  const confirmCancel = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          atPeriodEnd,
          reason,
          details,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel subscription');
      setShowConfirm(false);
      if (!atPeriodEnd) {
        // Immediate cancellation: end access right away and log out
        logout();
        return;
      }
      // Scheduled cancellation: keep access until period end
      router.push('/dashboard/billing?cancel=success');
    } catch (e: any) {
      setError(e.message || 'Failed to cancel');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/subscription/manage"
              className="flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Subscription
            </Link>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Cancel your plan
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You're currently on the {plan === 'advance' ? 'Professional' : 'Essential'} plan (
                {interval}).
                {atPeriodEnd && currentPeriodEnd
                  ? ` Cancellation will take effect on ${new Date(currentPeriodEnd).toLocaleDateString()}.`
                  : ' You can choose to cancel immediately or at the end of your billing period.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            We're sorry to see you go
          </h2>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
            Your feedback is valuable. Please select a reason for cancellation and let us know how
            we can improve.
          </p>

          <div className="mb-6 space-y-2">
            {reasons.map((r) => (
              <label
                key={r}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <input
                  type="radio"
                  name="cancel-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 dark:text-slate-200">{r}</span>
              </label>
            ))}
          </div>

          <div className="mb-6">
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Leave us some comments on what we could do better"
            />
          </div>

          <div className="mb-6 flex items-center gap-2">
            <input
              id="atPeriodEnd"
              type="checkbox"
              checked={atPeriodEnd}
              onChange={(e) => setAtPeriodEnd(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="atPeriodEnd" className="text-sm text-slate-700 dark:text-slate-300">
              Cancel at the end of the current billing period (recommended)
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/dashboard/subscription/manage"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Keep my plan
            </Link>
            <button
              onClick={startCancel}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              Cancel plan
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Confirm cancellation
            </h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              This will cancel your subscription
              {atPeriodEnd ? ' at the end of the current billing period.' : ' immediately.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirm(false);
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Back
              </button>
              <button
                onClick={confirmCancel}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" />
                    Processing
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Confirm cancel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
