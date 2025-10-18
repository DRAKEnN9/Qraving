'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, MapPin, Users, Hash, Store } from 'lucide-react';

export default function NewRestaurantPage() {
  const router = useRouter();
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
    slug: '',
    logoUrl: '',
    currency: 'INR',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  // Guard: enforce single-restaurant limit in UI
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/owner/restaurant', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return; // API will handle subscription/unauth separately
        const data = await res.json();
        if (Array.isArray(data.restaurants) && data.restaurants.length >= 1) {
          router.replace('/dashboard/restaurants?limit=1');
        }
      } catch {}
    })();
  }, [router]);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(prev.name) || !prev.slug ? generateSlug(name) : prev.slug,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Restaurant name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Restaurant name must be at least 2 characters';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Primary contact name is required';
    }
    if (!formData.primaryEmail.trim()) {
      newErrors.primaryEmail = 'Primary email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.primaryEmail)) {
      newErrors.primaryEmail = 'Please provide a valid email';
    }
    if (formData.contactPhone && formData.contactPhone.length > 20) {
      newErrors.contactPhone = 'Phone number is too long';
    }

    if (!formData.tableNumber) {
      newErrors.tableNumber = 'Number of tables is required';
    } else if (parseInt(formData.tableNumber) < 1) {
      newErrors.tableNumber = 'Number of tables must be at least 1';
    } else if (parseInt(formData.tableNumber) > 1000) {
      newErrors.tableNumber = 'Maximum 1000 tables allowed';
    }

    if (!formData.slug.trim() || !/^[a-z0-9-]+$/i.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
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

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, logoUrl: data.url }));
    } catch (error) {
      setErrors((prev) => ({ ...prev, logo: 'Failed to upload image' }));
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/owner/restaurant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          address: formData.address.trim(),
          contactName: formData.contactName.trim(),
          contactPhone: formData.contactPhone.trim() || undefined,
          primaryEmail: formData.primaryEmail.trim(),
          country: formData.country.trim() || undefined,
          state: formData.state.trim() || undefined,
          city: formData.city.trim() || undefined,
          pincode: formData.pincode.trim() || undefined,
          tableNumber: parseInt(formData.tableNumber),
          slug: formData.slug.trim(),
          logoUrl: formData.logoUrl || undefined,
          settings: { currency: formData.currency || 'INR' },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create restaurant');
      }

      const data = await response.json();

      // Redirect to menu builder to start adding menu items
      router.push(`/dashboard/restaurants/${data.restaurant._id}/menu`);
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/restaurants"
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Restaurants
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-slate-700"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                Add New Restaurant
              </h1>
              <p className="text-gray-600 dark:text-slate-400">
                Create your restaurant profile and get a QR code
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Logo Upload */}
            <div className="rounded-lg bg-white p-6 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
                <Store className="h-5 w-5 text-indigo-600" />
                Restaurant Logo
              </h2>

              <div className="flex items-center gap-6">
                <div className="flex-shrink-0">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Restaurant logo"
                      className="h-24 w-24 rounded-full object-cover ring-4 ring-gray-100 dark:ring-slate-700"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 ring-4 ring-gray-50 dark:bg-slate-800 dark:ring-slate-700">
                      <Store className="h-8 w-8 text-gray-400 dark:text-slate-500" />
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
                    <div className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400">
                      <Upload className="h-4 w-4" />
                      {logoUploading ? 'Uploading...' : 'Upload Logo'}
                    </div>
                  </label>
                  <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                    PNG, JPG, GIF up to 5MB. Recommended: 400x400px
                  </p>
                  {errors.logo && <p className="mt-1 text-sm text-red-600">{errors.logo}</p>}
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="rounded-lg bg-white p-6 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
                <MapPin className="h-5 w-5 text-indigo-600" />
                Basic Information
              </h2>

              <div className="space-y-4">
                {/* Restaurant Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-slate-300"
                  >
                    Restaurant Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 ${
                      errors.name
                        ? 'border-red-300 dark:border-red-500'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="e.g. Mario's Italian Kitchen"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 dark:text-slate-300"
                  >
                    Address *
                  </label>
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 ${
                      errors.address
                        ? 'border-red-300 dark:border-red-500'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="123 Main Street, New York, NY 10001"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>

                {/* Number of Tables */}
                <div>
                  <label
                    htmlFor="tableNumber"
                    className="block text-sm font-medium text-gray-700 dark:text-slate-300"
                  >
                    Number of Tables *
                  </label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                    <input
                      id="tableNumber"
                      type="number"
                      min="1"
                      max="1000"
                      value={formData.tableNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, tableNumber: e.target.value }))
                      }
                      className={`w-full rounded-lg border bg-white py-2 pl-10 pr-3 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 ${
                        errors.tableNumber
                          ? 'border-red-300 dark:border-red-500'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                      placeholder="20"
                    />
                  </div>
                  {errors.tableNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.tableNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact & Owner */}
            <div className="rounded-lg bg-white p-6 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
                <Users className="h-5 w-5 text-indigo-600" />
                Contact & Owner
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Primary Contact Name *
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contactName: e.target.value }))
                    }
                    className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 ${errors.contactName ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                    placeholder="Owner / Manager Name"
                  />
                  {errors.contactName && (
                    <p className="mt-1 text-sm text-red-600">{errors.contactName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Primary Email *
                  </label>
                  <input
                    type="email"
                    value={formData.primaryEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, primaryEmail: e.target.value }))
                    }
                    className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 ${errors.primaryEmail ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                    placeholder="owner@example.com"
                  />
                  {errors.primaryEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.primaryEmail}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Primary Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))
                    }
                    className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 ${errors.contactPhone ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'}`}
                    placeholder="+91 98765 43210"
                  />
                  {errors.contactPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.contactPhone}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AED">AED (د.إ)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="rounded-lg bg-white p-6 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
                <MapPin className="h-5 w-5 text-indigo-600" />
                Location Details
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="India"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="400001"
                  />
                </div>
              </div>
            </div>

            {/* URL Settings */}
            <div className="rounded-lg bg-white p-6 shadow-sm dark:border dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
                <Hash className="h-5 w-5 text-indigo-600" />
                Menu URL
              </h2>

              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-gray-700 dark:text-slate-300"
                >
                  URL Slug *
                </label>
                <div className="mt-1 flex rounded-lg border border-gray-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 dark:border-slate-600">
                  <span className="flex items-center border-r border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    yoursite.com/menu/
                  </span>
                  <input
                    id="slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }))
                    }
                    className="flex-1 rounded-r-lg border-0 bg-white px-3 py-2 text-gray-900 focus:outline-none dark:bg-slate-800 dark:text-slate-100"
                    placeholder="my-restaurant"
                  />
                </div>
                {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  This will be your menu URL. Use lowercase letters, numbers, and hyphens only.
                </p>
              </div>
            </div>

            {/* Submit */}
            {errors.submit && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                <p className="text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href="/dashboard/restaurants"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || logoUploading}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Restaurant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
