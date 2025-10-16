'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  DollarSign,
  Image as ImageIcon,
  MoreVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  priceCents: number;
  categoryId: string;
  images: string[];
  modifiers: { name: string; priceDelta: number }[];
  orderable: boolean;
  soldOut: boolean;
  sortOrder: number;
}

interface Category {
  _id: string;
  name: string;
  description: string;
  sortOrder: number;
  items?: MenuItem[];
}

interface Restaurant {
  _id: string;
  name: string;
  slug: string;
}

// Sortable Category Component
function SortableCategory({
  category,
  restaurant,
  onEditCategory,
  onDeleteCategory,
  onEditItem,
  onDeleteItem,
  onToggleSoldOut,
}: {
  category: Category;
  restaurant: Restaurant;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onEditItem: (item: MenuItem, categoryId: string) => void;
  onDeleteItem: (itemId: string, categoryId: string) => void;
  onToggleSoldOut: (item: MenuItem, categoryId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: category._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Category Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:text-slate-400 dark:hover:text-slate-200"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-gray-600 dark:text-slate-400">{category.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
            {category.items?.length || 0} items
          </span>
          <button
            onClick={() => onEditCategory(category)}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDeleteCategory(category._id)}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="p-4">
        {!category.items || category.items.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mb-2 text-4xl">🍽️</div>
            <p className="mb-4 text-gray-500 dark:text-slate-400">No items in this category yet</p>
            <Link
              href={`/dashboard/restaurants/${restaurant._id}/menu/items/new?category=${category._id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add First Item
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(category.items || [])
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 rounded-lg border border-gray-200 p-3 transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Item Image */}
                  <div className="h-16 w-16 flex-shrink-0">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800">
                        <ImageIcon className="h-6 w-6 text-gray-400 dark:text-slate-400" />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 w-full">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-slate-100">{item.name}</h4>
                        {item.description && (
                          <p className="line-clamp-1 text-sm text-gray-600 dark:text-slate-400">{item.description}</p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-semibold text-indigo-600">
                            {formatPrice(item.priceCents)}
                          </span>
                          {item.modifiers.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              +{item.modifiers.length} options
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Item Status & Actions */}
                      <div className="flex items-center gap-2">
                        {item.soldOut && (
                          <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-600">
                            Sold Out
                          </span>
                        )}
                        {!item.orderable && (
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                            Hidden
                          </span>
                        )}

                        <button
                          onClick={() => onToggleSoldOut(item, category._id)}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                            item.soldOut
                              ? 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              : 'border border-red-300 text-red-700 hover:bg-red-50'
                          }`}
                        >
                          {item.soldOut ? 'Mark Available' : 'Mark Sold Out'}
                        </button>

                        <button
                          onClick={() => onEditItem(item, category._id)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item._id, category._id)}
                          className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {/* Add Item Button */}
            <Link
              href={`/dashboard/restaurants/${restaurant._id}/menu/items/new?category=${category._id}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-4 text-gray-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
            >
              <Plus className="h-4 w-4" />
              Add Item to {category.name}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MenuManagementPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params?.id as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!restaurantId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch restaurant info, categories, and menu items
    Promise.all([
      fetch('/api/owner/restaurant', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`/api/owner/categories?restaurantId=${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`/api/owner/menu-items?restaurantId=${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(async ([restaurantRes, categoriesRes, itemsRes]) => {
        if (!restaurantRes.ok || !categoriesRes.ok || !itemsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const restaurantData = await restaurantRes.json();
        const categoriesData = await categoriesRes.json();
        const itemsData = await itemsRes.json();

        const found = restaurantData.restaurants?.find((r: Restaurant) => r._id === restaurantId);
        if (!found) throw new Error('Restaurant not found');

        setRestaurant(found);
        
        // Group items by category
        const categoriesWithItems = (categoriesData.categories || []).map((cat: Category) => ({
          ...cat,
          items: (itemsData.menuItems || []).filter((item: MenuItem) => String(item.categoryId) === String(cat._id)),
        }));
        
        setCategories(categoriesWithItems);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [restaurantId, router]);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = categories.findIndex((cat) => cat._id === active.id);
      const newIndex = categories.findIndex((cat) => cat._id === over.id);

      const newCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(newCategories);

      // Update sort order on server
      try {
        const token = localStorage.getItem('token');
        await fetch('/api/owner/categories/reorder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            categoryIds: newCategories.map((cat) => cat._id),
          }),
        });
      } catch (err) {
        console.error('Failed to update category order:', err);
        // Revert on error
        setCategories(categories);
      }
    }
  };

  const handleToggleSoldOut = async (item: MenuItem, categoryId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/owner/menu-items/${item._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ soldOut: !item.soldOut }),
      });
      if (!res.ok) throw new Error('Failed to update item');

      setCategories((prev: Category[]) =>
        prev.map((cat) =>
          cat._id === categoryId
            ? {
                ...cat,
                items: (cat.items || []).map((it) =>
                  it._id === item._id ? { ...it, soldOut: !item.soldOut } : it
                ),
              }
            : cat
        )
      );
    } catch (err) {
      console.error('Failed to toggle sold out:', err);
    }
  };

  const handleEditCategory = (category: Category) => {
    router.push(`/dashboard/restaurants/${restaurantId}/menu/categories/${category._id}/edit`);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this category? All items will be moved to "Uncategorized".'
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/owner/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete category');

      setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  const handleEditItem = (item: MenuItem, categoryId: string) => {
    router.push(
      `/dashboard/restaurants/${restaurantId}/menu/items/${item._id}/edit?category=${categoryId}`
    );
  };

  const handleDeleteItem = async (itemId: string, categoryId: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/owner/menu-items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete item');

      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === categoryId
            ? { ...cat, items: cat.items?.filter((item) => item._id !== itemId) || [] }
            : cat
        )
      );
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200"></div>
            <div className="h-10 w-32 animate-pulse rounded bg-gray-200"></div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="mb-4 text-6xl">😕</div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Error Loading Menu</h1>
            <p className="text-gray-600">{error}</p>
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Menu Builder</h1>
                <p className="text-gray-600 dark:text-slate-400">{restaurant.name}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 w-full sm:w-auto">
              <Link
                href={`/menu/${restaurant.slug}`}
                target="_blank"
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Eye className="h-4 w-4" />
                Preview Menu
              </Link>
              <Link
                href={`/dashboard/restaurants/${restaurantId}/menu/categories/new`}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {categories.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-6 rounded-full bg-indigo-100 p-6">
              <div className="text-4xl">🍽️</div>
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">Build Your Menu</h2>
            <p className="mb-8 max-w-md text-center text-gray-600">
              Start by creating categories like "Appetizers", "Main Courses", etc. Then add
              delicious items to each category.
            </p>
            <Link
              href={`/dashboard/restaurants/${restaurantId}/menu/categories/new`}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
              Create First Category
            </Link>
          </div>
        ) : (
          /* Categories List with Drag & Drop */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map((cat) => cat._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                {categories
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((category) => (
                    <SortableCategory
                      key={category._id}
                      category={category}
                      restaurant={restaurant}
                      onEditCategory={handleEditCategory}
                      onDeleteCategory={handleDeleteCategory}
                      onEditItem={handleEditItem}
                      onDeleteItem={handleDeleteItem}
                      onToggleSoldOut={handleToggleSoldOut}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Quick Stats */}
        {categories.length > 0 && (
          <div className="mt-12 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm dark:bg-slate-900 dark:border dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Categories</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{categories.length}</p>
                </div>
                <div className="rounded-full bg-indigo-100 p-3">
                  <div className="text-xl">📂</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm dark:bg-slate-900 dark:border dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {categories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0)}
                  </p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <div className="text-xl">🍽️</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm dark:bg-slate-900 dark:border dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Available Items</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {categories.reduce(
                      (sum, cat) =>
                        sum + (cat.items?.filter((item) => item.orderable && !item.soldOut).length || 0),
                      0
                    )}
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <div className="text-xl">✅</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm dark:bg-slate-900 dark:border dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Sold Out</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {categories.reduce(
                      (sum, cat) => sum + (cat.items?.filter((item) => item.soldOut).length || 0),
                      0
                    )}
                  </p>
                </div>
                <div className="rounded-full bg-red-100 p-3">
                  <div className="text-xl">❌</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
