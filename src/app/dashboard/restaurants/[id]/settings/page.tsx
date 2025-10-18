'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, Upload, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  address: string;
  contactName?: string;
  contactPhone?: string;
  primaryEmail?: string;
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  tableNumber: number;
  logoUrl?: string;
  settings: {
    currency: string;
    timezone: string;
    enableNotifications: boolean;
  };
}

export const dynamic = 'force-dynamic';

export default function RestaurantSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactName: '',
    contactPhone: '',
    primaryEmail: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
    tableNumber: '',
    logoUrl: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    enableNotifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!restaurantId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/owner/restaurant', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch restaurant');
        return res.json();
      })
      .then((data) => {
        const found = data.restaurants?.find((r: Restaurant) => r._id === restaurantId);
        if (!found) throw new Error('Restaurant not found');

        setRestaurant(found);
        setFormData({
          name: found.name,
          address: found.address,
          contactName: found.contactName || '',
          contactPhone: found.contactPhone || '',
          primaryEmail: found.primaryEmail || '',
          country: found.country || '',
          state: found.state || '',
          city: found.city || '',
          pincode: found.pincode || '',
          tableNumber: found.tableNumber.toString(),
          logoUrl: found.logoUrl || '',
          currency: found.settings?.currency || 'INR',
          timezone: found.settings?.timezone || 'Asia/Kolkata',
          enableNotifications: found.settings?.enableNotifications ?? true,
        });
        setLoading(false);
      })
      .catch((err) => {
        setErrors({ fetch: err.message });
        setLoading(false);
      });
  }, [restaurantId, router]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, logo: 'Please select an image file' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, logo: 'Image must be less than 5MB' }));
      return;
    }

    setLogoUploading(true);
    setErrors((prev) => ({ ...prev, logo: '' }));

    try {
      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setFormData((prev) => ({ ...prev, logoUrl: data.url }));
    } catch (error) {
      setErrors((prev) => ({ ...prev, logo: 'Failed to upload image' }));
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    setErrors({});

    setSaving(true);
    console.log('Saving restaurant settings...');

    try {
      const token = localStorage.getItem('token');

      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        contactName: formData.contactName.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        primaryEmail: formData.primaryEmail.trim() || undefined,
        country: formData.country.trim() || undefined,
        state: formData.state.trim() || undefined,
        city: formData.city.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        tableNumber: parseInt(formData.tableNumber),
        logoUrl: formData.logoUrl || undefined,
        settings: {
          currency: formData.currency,
          timezone: formData.timezone,
          enableNotifications: formData.enableNotifications,
        },
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`/api/owner/restaurant/${restaurantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('Update failed:', data);
        throw new Error(data.error || data.details?.[0]?.message || 'Failed to update restaurant');
      }

      const data = await response.json();
      console.log('Update successful:', data);

      // Show success message
      toast.success('Restaurant settings saved successfully!');

      // Wait a bit before redirecting so user sees the success message
      setTimeout(() => {
        router.push('/dashboard/restaurants');
      }, 1000);
    } catch (error: any) {
      console.error('Save error:', error);
      setErrors({ save: error.message });
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/owner/restaurant/${restaurantId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete restaurant');
      }

      router.push('/dashboard/restaurants');
    } catch (error: any) {
      setErrors({ delete: error.message });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200"></div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 text-6xl">😕</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Restaurant Not Found</h1>
            <Link
              href="/dashboard/restaurants"
              className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/restaurants"
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Restaurants
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Restaurant Settings</h1>
              <p className="text-gray-600 dark:text-slate-400">{restaurant.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Logo Section */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold dark:text-slate-100">Restaurant Logo</h2>

            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Restaurant logo"
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-gray-100"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 ring-4 ring-gray-50">
                    <span className="text-2xl">🏪</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={logoUploading}
                  />
                  <div className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:text-indigo-400">
                    <Upload className="h-4 w-4" />
                    {logoUploading ? 'Uploading...' : 'Change Logo'}
                  </div>
                </label>
                {errors.logo && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.logo}</p>}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold dark:text-slate-100">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Restaurant Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Number of Tables</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.tableNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tableNumber: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Contact & Owner Information */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold dark:text-slate-100">Contact & Owner Information</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Primary Contact Name</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Owner / Manager Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Primary Email</label>
                <input
                  type="email"
                  value={formData.primaryEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, primaryEmail: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="owner@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Primary Contact Number</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold dark:text-slate-100">Location Details</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="India"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Maharashtra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Mumbai"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="400001"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold dark:text-slate-100">Preferences</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={formData.enableNotifications}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, enableNotifications: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="notifications" className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Enable email notifications for new orders
                </label>
              </div>
            </div>
          </div>


          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>

          {/* Error Messages */}
          {(errors.save || errors.delete) && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400">{errors.save || errors.delete}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Delete Restaurant</h3>
            </div>

            <p className="mb-6 text-gray-600 dark:text-slate-400">
              Are you sure you want to delete "{restaurant.name}"? This action cannot be undone and
              will remove all associated menu items and orders.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
