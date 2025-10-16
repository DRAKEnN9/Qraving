"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([
      fetch("/api/account/profile", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/owner/restaurant", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => ({ restaurants: [] })),
    ])
      .then(([profile, rest]) => {
        if (profile?.user) {
          setUser(profile.user);
          setName(profile.user.name || "");
          setEmail(profile.user.email || "");
          setOriginalEmail(profile.user.email || "");
        }
        setRestaurants(rest?.restaurants || []);
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [router]);

  const saveProfile = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, email, currentPassword: email !== originalEmail ? currentPassword : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setUser(data.user);
      setOriginalEmail(data.user.email || "");
      setCurrentPassword("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900">Account Profile</h1>
          <p className="text-sm text-slate-600">Manage your personal details and view connected restaurants</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Your Details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {email !== originalEmail && (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password to change email"
                  />
                </div>
              )}
            </div>
            <div className="mt-4">
              <button
                onClick={saveProfile}
                disabled={saving || (email !== originalEmail && !currentPassword)}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {email !== originalEmail && !currentPassword && (
                <p className="mt-2 text-sm text-amber-600">Current password required to change email</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Account</h2>
            <p className="text-sm text-slate-600"><span className="font-semibold">Role:</span> {user?.role}</p>
            <p className="text-sm text-slate-600"><span className="font-semibold">Member since:</span> {new Date(user?.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Connected Restaurants</h2>
          {restaurants.length === 0 ? (
            <p className="text-slate-600">No restaurants found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((r) => (
                <div key={r._id} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{r.name}</p>
                  <p className="text-sm text-slate-600">Tables: {r.tableNumber}</p>
                  <p className="text-sm text-slate-600">Slug: {r.slug}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
