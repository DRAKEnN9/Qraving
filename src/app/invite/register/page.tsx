"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Shield, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';

function RegisterFromInvitePageContent() {
  const router = useRouter();
  const params = useSearchParams();

  const memberId = params.get('memberId') || '';
  const token = params.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'admin'>('admin');
  const [status, setStatus] = useState<'invited' | 'active' | ''>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!memberId || !token) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError('');
        const q = new URLSearchParams({ memberId, token });
        const res = await fetch(`/api/account/members/register?${q.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid or expired link');
        setEmail(data.email);
        setRole(data.role);
        setStatus(data.status);
        if (data.status === 'active') {
          setMessage('This invitation has already been accepted. You can log in.');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [memberId, token]);

  const canSubmit = useMemo(() => {
    return !loading && status !== 'active' && password.length >= 8 && password === confirmPassword;
  }, [loading, status, password, confirmPassword]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      setError('');
      const res = await fetch('/api/account/members/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete registration');
      // Store token for app auth
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      setMessage('Your account has been created. Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black text-slate-900">Accept Invitation</h1>
            <p className="mt-1 text-sm text-slate-600">Create your password to join this account.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-600">Loading invite…</div>
          ) : (
            <>
              {error && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              {message && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle className="mt-0.5 h-4 w-4" />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-700"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Assigned by the owner. Cannot be changed.</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                  <div className="relative">
                    <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={role === 'owner' ? 'Owner' : 'Manager'}
                      disabled
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-700"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Chosen by the owner. Cannot be changed.</p>
                </div>

                {status !== 'active' && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Create Password</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      {password && confirmPassword && password !== confirmPassword && (
                        <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!canSubmit || submitting}
                      className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {submitting ? 'Creating…' : 'Create Account'}
                    </button>
                  </>
                )}

                {status === 'active' && (
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Go to Login
                    </button>
                  </div>
                )}

                <div className="pt-2 text-center text-xs text-slate-500">
                  Need help? Contact your account owner.
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function RegisterFromInvitePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <RegisterFromInvitePageContent />
    </Suspense>
  );
}
