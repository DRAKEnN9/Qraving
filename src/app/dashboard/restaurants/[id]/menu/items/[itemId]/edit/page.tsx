'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  Plus, 
  DollarSign, 
  Image as ImageIcon,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
}

interface Modifier {
  name: string;
  priceDelta: number;
}

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  priceCents: number;
  categoryId: string;
  images: string[];
  modifiers: Modifier[];
  orderable: boolean;
  soldOut: boolean;
}

export default function EditMenuItemPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const restaurantId = params?.id as string;
  const itemId = params?.itemId as string;
  const currentCategoryId = searchParams?.get('category');
  
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceCents: '',
    categoryId: '',
    images: [] as string[],
    modifiers: [] as Modifier[],
    orderable: true,
    soldOut: false,
  });
  const [newModifier, setNewModifier] = useState({ name: '', priceDelta: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!itemId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch menu item and categories
    Promise.all([
      fetch(`/api/owner/menu-items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`/api/owner/categories?restaurantId=${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(async ([itemRes, categoriesRes]) => {
        if (!itemRes.ok || !categoriesRes.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const itemData = await itemRes.json();
        const categoriesData = await categoriesRes.json();
        
        setMenuItem(itemData.menuItem);
        setCategories(categoriesData.categories || []);
        
        // Populate form
        const item = itemData.menuItem;
        setFormData({
          name: item.name,
          description: item.description || '',
          priceCents: (item.priceCents / 100).toFixed(2),
          categoryId: item.categoryId || currentCategoryId || '',
          images: item.images || [],
          modifiers: item.modifiers || [],
          orderable: item.orderable,
          soldOut: item.soldOut,
        });
        
        setLoading(false);
      })
      .catch((err) => {
        setErrors({ fetch: err.message });
        setLoading(false);
      });
  }, [itemId, restaurantId, currentCategoryId, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Item name must be at least 2 characters';
    }

    if (!formData.priceCents) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(formData.priceCents) < 0) {
      newErrors.price = 'Price must be positive';
    } else if (parseFloat(formData.priceCents) > 999.99) {
      newErrors.price = 'Price must be less than $999.99';
    }

    if (!formData.categoryId) {
      newErrors.category = 'Please select a category';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Please select an image file' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image must be less than 5MB' }));
      return;
    }

    setImageUploading(true);
    setErrors(prev => ({ ...prev, image: '' }));

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
      setFormData(prev => ({ 
        ...prev, 
        images: [...prev.images, data.url] 
      }));
    } catch (error) {
      setErrors(prev => ({ ...prev, image: 'Failed to upload image' }));
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addModifier = () => {
    if (!newModifier.name.trim()) return;

    const modifier: Modifier = {
      name: newModifier.name.trim(),
      priceDelta: parseFloat(newModifier.priceDelta) * 100 || 0, // Convert to cents
    };

    setFormData(prev => ({
      ...prev,
      modifiers: [...prev.modifiers, modifier]
    }));

    setNewModifier({ name: '', priceDelta: '' });
  };

  const removeModifier = (index: number) => {
    setFormData(prev => ({
      ...prev,
      modifiers: prev.modifiers.filter((_, i) => i !== index)
    }));
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/owner/menu-items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          priceCents: Math.round(parseFloat(formData.priceCents) * 100),
          categoryId: formData.categoryId,
          images: formData.images,
          modifiers: formData.modifiers,
          orderable: formData.orderable,
          soldOut: formData.soldOut,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update menu item');
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
      const response = await fetch(`/api/owner/menu-items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete menu item');
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
          <div className="mx-auto max-w-4xl">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200 mb-8"></div>
            <div className="grid gap-8 lg:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-6">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-32 animate-pulse rounded-lg bg-gray-200"></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!menuItem) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 text-6xl">😕</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Menu Item Not Found</h1>
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Menu Item</h1>
              <p className="text-gray-600">{menuItem.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Left Column - Basic Info */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
                  
                  <div className="space-y-4">
                    {/* Item Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Item Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="e.g. Grilled Salmon with Herbs"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        maxLength={500}
                        className={`mt-1 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.description ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Describe your dish, ingredients, cooking method..."
                      />
                      <div className="mt-1 flex justify-between">
                        {errors.description ? (
                          <p className="text-sm text-red-600">{errors.description}</p>
                        ) : (
                          <div></div>
                        )}
                        <p className="text-xs text-gray-500">
                          {formData.description.length}/500 characters
                        </p>
                      </div>
                    </div>

                    {/* Price and Category */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                          Price *
                        </label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            max="999.99"
                            value={formData.priceCents}
                            onChange={(e) => setFormData(prev => ({ ...prev, priceCents: e.target.value }))}
                            className={`w-full rounded-lg border pl-10 pr-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                              errors.price ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="12.99"
                          />
                        </div>
                        {errors.price && (
                          <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                          Category *
                        </label>
                        <select
                          id="category"
                          value={formData.categoryId}
                          onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                          className={`mt-1 w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            errors.category ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select category</option>
                          {categories.map((category) => (
                            <option key={category._id} value={category._id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        {errors.category && (
                          <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                        )}
                      </div>
                    </div>

                    {/* Availability Settings */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="orderable"
                          checked={formData.orderable}
                          onChange={(e) => setFormData(prev => ({ ...prev, orderable: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="orderable" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          {formData.orderable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          Available for ordering
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="soldOut"
                          checked={formData.soldOut}
                          onChange={(e) => setFormData(prev => ({ ...prev, soldOut: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <label htmlFor="soldOut" className="text-sm font-medium text-gray-700">
                          Currently sold out
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modifiers */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold">Add-ons & Modifiers</h2>
                  
                  {/* Add New Modifier */}
                  <div className="mb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newModifier.name}
                        onChange={(e) => setNewModifier(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Extra Cheese"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                          <input
                            type="number"
                            step="0.01"
                            value={newModifier.priceDelta}
                            onChange={(e) => setNewModifier(prev => ({ ...prev, priceDelta: e.target.value }))}
                            placeholder="2.00"
                            className="w-full rounded-lg border border-gray-300 pl-6 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addModifier}
                          className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Existing Modifiers */}
                  {formData.modifiers.length > 0 && (
                    <div className="space-y-2">
                      {formData.modifiers.map((modifier, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                          <span className="text-sm font-medium">{modifier.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {modifier.priceDelta > 0 ? `+${formatPrice(modifier.priceDelta)}` : 'Free'}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeModifier(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Images & Preview */}
              <div className="space-y-6">
                {/* Images */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold">Images</h2>
                  
                  {/* Upload Area */}
                  <div className="mb-4">
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={imageUploading}
                      />
                      <div className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-8 transition-colors hover:border-indigo-300">
                        <Upload className="mb-2 h-8 w-8 text-gray-400" />
                        <p className="text-sm font-medium text-gray-600">
                          {imageUploading ? 'Uploading...' : 'Click to upload image'}
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </label>
                    {errors.image && (
                      <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                    )}
                  </div>

                  {/* Image Gallery */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {formData.images.map((image, index) => (
                        <div key={index} className="group relative">
                          <img
                            src={image}
                            alt={`Menu item ${index + 1}`}
                            className="h-24 w-full rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold">Preview</h2>
                  
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex gap-4">
                      {formData.images[0] ? (
                        <img
                          src={formData.images[0]}
                          alt="Preview"
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {formData.name || 'Item Name'}
                        </h4>
                        {formData.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {formData.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="font-semibold text-indigo-600">
                            {formData.priceCents ? `$${formData.priceCents}` : '$0.00'}
                          </span>
                          {formData.modifiers.length > 0 && (
                            <span className="text-xs text-gray-500">
                              +{formData.modifiers.length} options
                            </span>
                          )}
                        </div>
                        {(formData.soldOut || !formData.orderable) && (
                          <div className="mt-2 flex gap-2">
                            {formData.soldOut && (
                              <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-600">
                                Sold Out
                              </span>
                            )}
                            {!formData.orderable && (
                              <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                Hidden
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving || imageUploading}
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
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Menu Item</h3>
            </div>
            
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete "{menuItem.name}"? This action cannot be undone.
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
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
