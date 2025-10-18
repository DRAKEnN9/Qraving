'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Hash, Trash2, AlertTriangle } from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  description: string;
  sortOrder: number;
}

export const dynamic = 'force-dynamic';

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.id as string;
  const categoryId = params?.categoryId as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!categoryId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch(`/api/owner/categories?restaurantId=${restaurantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch category');
        return res.json();
      })
      .then((data) => {
        const found = data.categories?.find((cat: Category) => cat._id === categoryId);
        if (!found) throw new Error('Category not found');
        
        setCategory(found);
        setFormData({
          name: found.name,
          description: found.description || '',
        });
        setLoading(false);
      })
      .catch((err) => {
        setErrors({ fetch: err.message });
        setLoading(false);
      });
  }, [categoryId, restaurantId, router]);

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

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/owner/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update category');
      }

      // Redirect back to menu management
      router.push(`/dashboard/restaurants/${restaurantId}/menu`);
    } catch (error: any) {
      setErrors({ save: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/owner/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete category');
      }

      router.push(`/dashboard/restaurants/${restaurantId}/menu`);
    } catch (error: any) {
      setErrors({ delete: error.message });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200 mb-8"></div>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 text-6xl">😕</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Category Not Found</h1>
            <Link
              href={`/dashboard/restaurants/${restaurantId}/menu`}
              className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/restaurants/${restaurantId}/menu`}
              className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Menu
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
              <p className="text-gray-600">{category.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-8">
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
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-red-600">{errors.save || errors.delete}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Category</h3>
            </div>
            
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete "{category.name}"? All items in this category will be moved to "Uncategorized". This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
