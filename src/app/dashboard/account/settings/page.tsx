"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function AccountSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [deleting, setDeleting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setRole(d.user.role);
      })
      .catch(() => setError("Failed to load account"))
      .finally(() => setLoading(false));
  }, [router]);

  const deleteAccount = async () => {
    if (!currentPassword) {
      setError("Please enter your current password to delete your account");
      return;
    }
    
    try {
      setDeleting(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/account/delete", { 
        method: "DELETE", 
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ currentPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");
      localStorage.removeItem("token");
      router.push("/");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Account Settings</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Basic settings and account management</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900/40 dark:bg-red-900/20">{error}</div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Your Role</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300">You are signed in as <span className="font-semibold">{role}</span>.</p>
        </div>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/40 dark:bg-red-900/20">
          <h2 className="mb-2 text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
          <p className="mb-4 text-sm text-red-700 dark:text-red-300">Deleting your account will remove your subscription, restaurants, orders and members. This cannot be undone.</p>
          
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={role !== 'owner'}
              className="rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-60 dark:border-red-700 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
              title={role !== 'owner' ? 'Only the owner can delete the account' : ''}
            >
              Delete Account
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-red-700 dark:text-red-400">Enter your current password to confirm deletion</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full max-w-md rounded-lg border border-red-300 px-3 py-2 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Current password"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={deleteAccount}
                  disabled={deleting || !currentPassword}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? 'Deleting…' : 'Confirm Delete Account'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setCurrentPassword("");
                    setError("");
                  }}
                  disabled={deleting}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
