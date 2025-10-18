'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Hash } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function NewCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.id as string;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/owner/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          restaurantId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create category');
      }

      // Redirect back to menu management
      router.push(`/dashboard/restaurants/${restaurantId}/menu`);
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/restaurants/${restaurantId}/menu`}
              className="flex items-center gap-2 text-gray-600 dark:text-slate-400 transition-colors hover:text-gray-900 dark:hover:text-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Menu
            </Link>
            <div className="h-6 w-px bg-gray-300 dark:bg-slate-700"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Add Category</h1>
              <p className="text-gray-600 dark:text-slate-400">Create a new menu category</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Category Information */}
            <div className="rounded-lg bg-white dark:bg-slate-900 dark:border dark:border-slate-800 p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
                <Hash className="h-5 w-5 text-indigo-600" />
                Category Details
              </h2>
              
              <div className="space-y-4">
                {/* Category Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Category Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 ${
                      errors.name ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="e.g. Appetizers, Main Courses, Desserts"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    maxLength={200}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 ${
                      errors.description ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-slate-600'
                    }`}
                    placeholder="Brief description of this category (optional)"
                  />
                  <div className="mt-1 flex justify-between">
                    {errors.description ? (
                      <p className="text-sm text-red-600">{errors.description}</p>
                    ) : (
                      <div></div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {formData.description.length}/200 characters
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-white dark:bg-slate-900 dark:border dark:border-slate-800 p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-slate-100">Preview</h3>
              <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                <h4 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
                  {formData.name || 'Category Name'}
                </h4>
                {formData.description && (
                  <p className="mt-1 text-gray-600 dark:text-slate-400">{formData.description}</p>
                )}
                <div className="mt-3 text-sm text-gray-500 dark:text-slate-400">
                  Menu items will appear here...
                </div>
              </div>
            </div>

            {/* Submit */}
            {errors.submit && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                <p className="text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href={`/dashboard/restaurants/${restaurantId}/menu`}
                className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-center font-medium text-gray-700 dark:text-slate-300 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>

          {/* Tips */}
          <div className="mt-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6">
            <h4 className="mb-3 font-semibold text-blue-900 dark:text-blue-200">💡 Category Tips</h4>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200/80">
              <li>• Use clear, descriptive names like "Appetizers", "Main Courses", "Beverages"</li>
              <li>• Categories help customers navigate your menu easily</li>
              <li>• You can reorder categories by dragging them in the menu builder</li>
              <li>• Add items to categories after creating them</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
