'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = (params?.id as string) || '';
  const catId = (params?.catId as string) || '';

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Load category by fetching all and filtering (no GET /categories/[id] provided)
    (async () => {
      try {
        const res = await fetch(`/api/owner/categories?restaurantId=${restaurantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load category');
        const data = await res.json();
        const cat = (data.categories || []).find((c: any) => c._id === catId);
        if (!cat) throw new Error('Category not found');
        setName(cat.name || '');
        setLoading(false);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
        setLoading(false);
      }
    })();
  }, [router, restaurantId, catId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Category name is required');
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/owner/categories/${catId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to update category');
      }
      router.push(`/dashboard/menu-builder/${restaurantId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Edit Category</h1>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Appetizers"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/menu-builder/${restaurantId}`)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
