'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Hash } from 'lucide-react';

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
      router.push(`/dashboard/menu-builder/${restaurantId}`);
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/menu-builder/${restaurantId}`}
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Menu
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Category</h1>
              <p className="text-gray-600">Create a new menu category</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Category Information */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Hash className="h-5 w-5 text-indigo-600" />
                Category Details
              </h2>
              
              <div className="space-y-4">
                {/* Category Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Category Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g. Appetizers, Main Courses, Desserts"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    maxLength={200}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Brief description of this category (optional)"
                  />
                  <div className="mt-1 flex justify-between">
                    {errors.description ? (
                      <p className="text-sm text-red-600">{errors.description}</p>
                    ) : (
                      <div></div>
                    )}
                    <p className="text-xs text-gray-500">
                      {formData.description.length}/200 characters
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Preview</h3>
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="text-xl font-semibold text-gray-900">
                  {formData.name || 'Category Name'}
                </h4>
                {formData.description && (
                  <p className="mt-1 text-gray-600">{formData.description}</p>
                )}
                <div className="mt-3 text-sm text-gray-500">
                  Menu items will appear here...
                </div>
              </div>
            </div>

            {/* Submit */}
            {errors.submit && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href={`/dashboard/menu-builder/${restaurantId}`}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
          <div className="mt-8 rounded-lg bg-blue-50 p-6">
            <h4 className="mb-3 font-semibold text-blue-900">💡 Category Tips</h4>
            <ul className="space-y-2 text-sm text-blue-800">
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
