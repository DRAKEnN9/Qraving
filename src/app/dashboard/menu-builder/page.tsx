'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Plus, ChevronRight, Package, UtensilsCrossed } from 'lucide-react';

interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  logoUrl?: string;
}

export const dynamic = 'force-dynamic';

export default function MenuBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchRestaurants();
  }, [router]);

  const fetchRestaurants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/owner/restaurant', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch restaurants');

      const data = await response.json();
      setRestaurants(data.restaurants || []);
      
      // If only one restaurant, redirect directly to its menu builder
      if (data.restaurants && data.restaurants.length === 1) {
        router.push(`/dashboard/menu-builder/${data.restaurants[0]._id}`);
        return;
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <UtensilsCrossed className="mx-auto h-12 w-12 animate-pulse text-emerald-600" />
          <p className="mt-4 text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Menu Builder</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Select a restaurant to manage its menu
        </p>
      </div>

      {/* Restaurant Selection */}
      {restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-6 rounded-full bg-emerald-100 p-6">
            <Store className="h-16 w-16 text-emerald-600" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">No Restaurants Yet</h2>
          <p className="mb-8 max-w-md text-center text-slate-600 dark:text-slate-400">
            Create a restaurant first to start building your menu
          </p>
          <Link
            href="/dashboard/restaurants/new"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5" />
            Create Restaurant
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant._id}
              href={`/dashboard/menu-builder/${restaurant._id}`}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm transition-all hover:shadow-lg hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Restaurant Logo/Icon */}
              <div className="mb-4 flex items-center justify-between">
                {restaurant.logoUrl ? (
                  <img
                    src={restaurant.logoUrl}
                    alt={restaurant.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                    <Store className="h-8 w-8 text-white" />
                  </div>
                )}
                <div className="rounded-full bg-emerald-50 p-2 transition-all group-hover:bg-emerald-100">
                  <ChevronRight className="h-5 w-5 text-emerald-600" />
                </div>
              </div>

              {/* Restaurant Info */}
              <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                {restaurant.name}
              </h3>
              {restaurant.description && (
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {restaurant.description}
                </p>
              )}

              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4 text-emerald-600" />
                  <span>Manage Menu</span>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 border-2 border-emerald-600 opacity-0 transition-opacity group-hover:opacity-100 rounded-xl pointer-events-none"></div>
            </Link>
          ))}
        </div>
      )}

      {/* Help Section */}
      {restaurants.length > 0 && (
        <div className="mt-12 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-6 dark:border-blue-900/30 dark:bg-blue-900/20">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-800/50">
              <UtensilsCrossed className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold text-blue-900 dark:text-blue-200">Menu Builder Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200/80">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600"></span>
                  <span>
                    <strong>Drag & Drop:</strong> Reorder categories by dragging them
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600"></span>
                  <span>
                    <strong>Quick Edit:</strong> Click on any item to edit it inline
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600"></span>
                  <span>
                    <strong>Availability:</strong> Toggle items as sold out directly from the list
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
