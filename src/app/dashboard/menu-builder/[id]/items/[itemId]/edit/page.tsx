'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ImageUploader from '@/components/ui/ImageUploader';

interface Category { _id: string; name: string; }

interface ModifierForm { id: string; name: string; priceRupees: string; }

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = (params?.id as string) || '';
  const itemId = (params?.itemId as string) || '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceRupees, setPriceRupees] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [orderable, setOrderable] = useState(true);
  const [soldOut, setSoldOut] = useState(false);
  const [modifiers, setModifiers] = useState<ModifierForm[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    (async () => {
      try {
        // Load categories
        const catsRes = await fetch(`/api/owner/categories?restaurantId=${restaurantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!catsRes.ok) throw new Error('Failed to load categories');
        const catsJson = await catsRes.json();
        setCategories(catsJson.categories || []);

        // Load item
        const itemRes = await fetch(`/api/owner/menu-items/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!itemRes.ok) throw new Error('Failed to load item');
        const itemJson = await itemRes.json();
        const it = itemJson.menuItem;
        setCategoryId(String(it.categoryId));
        setName(it.name || '');
        setDescription(it.description || '');
        setPriceRupees(((it.priceCents || 0) / 100).toFixed(2));
        setImages(it.images || []);
        setOrderable(!!it.orderable);
        setSoldOut(!!it.soldOut);
        setModifiers(
          (it.modifiers || []).map((m: any) => ({
            id: crypto.randomUUID(),
            name: m.name,
            priceRupees: ((m.priceDelta || 0) / 100).toFixed(2),
          }))
        );
        setLoading(false);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
        setLoading(false);
      }
    })();
  }, [restaurantId, itemId, router]);

  // Images are uploaded via ImageUploader and we directly manage URL list

  const addModifier = () => {
    setModifiers((prev) => [...prev, { id: crypto.randomUUID(), name: '', priceRupees: '' }]);
  };
  const updateModifier = (id: string, field: 'name' | 'priceRupees', value: string) => {
    setModifiers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };
  const removeModifier = (id: string) => setModifiers((prev) => prev.filter((m) => m.id !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Item name is required');
    if (!categoryId) return setError('Please select a category');

    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('token');
      const priceCents = Math.round(parseFloat(priceRupees || '0') * 100);
      const mods = modifiers
        .filter((m) => m.name.trim())
        .map((m) => ({ name: m.name.trim(), priceDelta: Math.round(parseFloat(m.priceRupees || '0') * 100) }));

      const res = await fetch(`/api/owner/menu-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoryId,
          name: name.trim(),
          description: description.trim() || undefined,
          priceCents,
          images: images.length ? images : undefined,
          orderable,
          soldOut,
          modifiers: mods.length ? mods : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to update item');
      }
      router.push(`/dashboard/menu-builder/${restaurantId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update item');
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Edit Item</h1>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceRupees}
                onChange={(e) => setPriceRupees(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="199.00"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Item name"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Optional description"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Images</label>
            <ImageUploader images={images} onChange={setImages} maxFiles={6} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={orderable} onChange={(e) => setOrderable(e.target.checked)} />
              <span className="text-sm text-slate-700">Orderable (visible)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={soldOut} onChange={(e) => setSoldOut(e.target.checked)} />
              <span className="text-sm text-slate-700">Sold Out</span>
            </label>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Modifiers</label>
              <button type="button" onClick={addModifier} className="text-sm text-emerald-700 hover:underline">
                + Add modifier
              </button>
            </div>
            <div className="space-y-2">
              {modifiers.map((m) => (
                <div key={m.id} className="grid gap-2 md:grid-cols-5 items-center">
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => updateModifier(m.id, 'name', e.target.value)}
                    className="md:col-span-3 rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Modifier name"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={m.priceRupees}
                    onChange={(e) => updateModifier(m.id, 'priceRupees', e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Price (₹)"
                  />
                  <button type="button" onClick={() => removeModifier(m.id)} className="text-sm text-red-600 hover:underline">
                    Remove
                  </button>
                </div>
              ))}
              {modifiers.length === 0 && <p className="text-xs text-slate-500">No modifiers.</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !name.trim() || !priceRupees || !categoryId}
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
