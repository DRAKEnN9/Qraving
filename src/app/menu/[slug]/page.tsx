'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Plus, Minus, ShoppingCart, Search, X, Clock, MapPin, AlertCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';
import { useSocket } from '@/contexts/SocketContext';

interface Modifier {
  name: string;
  priceDelta: number;
}

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  priceCents: number;
  images: string[];
  orderable: boolean;
  soldOut: boolean;
  modifiers: Modifier[];
}

interface Category {
  _id: string;
  name: string;
  description: string;
  items: MenuItem[];
}

interface Restaurant {
  _id: string;
  name: string;
  description: string;
  slug: string;
  logo?: string;
  address?: string;
  phone?: string;
  hours?: string;
}

function CustomerMenuPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const {
    addItem,
    updateQuantity,
    getTotalItems,
    getTotalPrice,
    items,
    setRestaurantId,
    clearCart,
  } = useCart();
  const { socket, isConnected } = useSocket();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [error, setError] = useState<string>('');
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    fetchMenu();

    // Check for order success from URL params
    const orderId = searchParams.get('orderId');
    const orderNum = searchParams.get('orderNumber');

    if (orderId && orderNum) {
      setShowOrderSuccess(true);
      setOrderNumber(orderNum);

      // Clear cart after successful order
      clearCart();

      // Show success toast
      toast.success(`Order #${orderNum} placed! Check your email for confirmation.`, {
        duration: 5000,
      });

      // Clean URL after showing message
      setTimeout(() => {
        router.replace(`/menu/${slug}`);
      }, 500);
    }
  }, [slug, searchParams]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`/api/menu/${slug}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch menu');
      }

      const data = await response.json();
      setRestaurant(data.restaurant);
      setCategories(data.categories);
      setRestaurantId(data.restaurant._id);
      setLoading(false);
    } catch (err: any) {
      console.error('Menu fetch error:', err);
      setError(err.message || 'Failed to load menu');
      setLoading(false);
    }
  };

  // Real-time updates for menu items (e.g., soldOut toggles)
  useEffect(() => {
    if (!restaurant || !socket || !isConnected) return;
    
    // Customers should NOT join restaurant room - that's only for restaurant staff
    // They will join their specific order room when they place an order
    
    const handleMenuItemUpdated = (data: any) => {
      setCategories((prev) =>
        prev.map((cat) =>
          !cat.items
            ? cat
            : {
                ...cat,
                items: cat.items.map((it) =>
                  it._id === data.itemId
                    ? {
                        ...it,
                        soldOut: data.soldOut ?? it.soldOut,
                        orderable: data.orderable ?? it.orderable,
                        name: data.name ?? it.name,
                        priceCents: data.priceCents ?? it.priceCents,
                        images: Array.isArray(data.images) ? data.images : it.images,
                        description: data.description ?? it.description,
                        modifiers: Array.isArray(data.modifiers) ? data.modifiers : it.modifiers,
                      }
                    : it
                ),
              }
        )
      );
    };

    socket.on('menu-item-updated', handleMenuItemUpdated);
    return () => {
      socket.off('menu-item-updated', handleMenuItemUpdated);
    };
  }, [restaurant?._id, socket, isConnected]);

  const formatPrice = (cents: number) => `₹${(cents / 100).toFixed(2)}`;

  const handleAddToCart = (item: MenuItem, customQuantity?: number) => {
    if (!item.orderable || item.soldOut) {
      toast.error('This item is not available');
      return;
    }

    const modifiers = selectedModifiers.map((modName) => {
      const modifier = item.modifiers.find((m) => m.name === modName);
      return modifier || { name: modName, priceDelta: 0 };
    });

    addItem({
      menuItemId: item._id,
      name: item.name,
      priceCents: item.priceCents,
      quantity: customQuantity || quantity,
      modifiers,
      image: item.images[0],
      notes: specialNotes,
    });

    toast.success(`${item.name} added to cart!`);
    setSelectedItem(null);
    setSelectedModifiers([]);
    setQuantity(1);
    setSpecialNotes('');
  };

  const filteredCategories = categories
    .filter((category) => selectedCategory === 'all' || category._id === selectedCategory)
    .map((category) => ({
      ...category,
      items: category.items?.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.items && category.items.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <div className="mb-8 h-32 animate-pulse rounded-lg bg-gray-200"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-4 max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Restaurant Not Found</h2>
          <p className="mb-4 text-gray-600">
            {error || "The menu you're looking for doesn't exist."}
          </p>

          <div className="mt-6 rounded-lg bg-blue-50 p-4 text-left">
            <p className="mb-2 text-sm font-semibold text-blue-900">💡 Common Issues:</p>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>
                • Make sure you're using the restaurant <strong>slug</strong>, not the ID
              </li>
              <li>
                • URL should be:{' '}
                <code className="rounded bg-blue-100 px-1">/menu/restaurant-slug</code>
              </li>
              <li>
                • Check:{' '}
                <a href="/api/debug/restaurants" className="font-semibold underline">
                  /api/debug/restaurants
                </a>
              </li>
            </ul>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-500">
              Current URL: <code className="rounded bg-gray-100 px-2 py-1">/menu/{slug}</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {restaurant.logo && (
                <Image
                  src={restaurant.logo}
                  alt={restaurant.name}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
                {restaurant.address && (
                  <p className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {restaurant.address}
                  </p>
                )}
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden sm:inline">Cart</span>
                {getTotalItems() > 0 && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-indigo-600">
                    {getTotalItems()}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="sticky top-[72px] z-30 border-b bg-white shadow-sm">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex gap-2 overflow-x-auto py-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items ({categories.reduce((sum, cat) => sum + (cat.items?.length || 0), 0)})
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategory(category._id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category._id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name} ({category.items?.length || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Search className="mb-4 h-16 w-16 text-gray-400" />
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">No items found</h2>
            <p className="text-gray-600">Try adjusting your search</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCategories.map((category) => (
              <div key={category._id}>
                <h2 className="mb-4 text-2xl font-bold text-gray-900">{category.name}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {category.items?.map((item) => (
                    <div
                      key={item._id}
                      className="group flex gap-3 overflow-hidden rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-md"
                    >
                      {/* Item Image */}
                      {item.images?.[0] && (
                        <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            src={item.images[0]}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                          {item.soldOut && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                              <span className="rounded-full bg-red-600 px-4 py-2 font-bold text-white">
                                SOLD OUT
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Item Details */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="line-clamp-1 font-semibold text-gray-900">
                              {item.name}
                            </h3>
                            <span className="whitespace-nowrap text-sm font-bold text-indigo-600">
                              {formatPrice(item.priceCents)}
                            </span>
                          </div>
                          {item.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Add to Cart Button */}
                        <div className="mt-2">
                          {item.orderable && !item.soldOut ? (
                            <button
                              onClick={() => {
                                if (item.modifiers && item.modifiers.length > 0) {
                                  setSelectedItem(item);
                                } else {
                                  handleAddToCart(item, 1);
                                }
                              }}
                              className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                            >
                              <div className="flex items-center justify-center gap-1">
                                <Plus className="h-3 w-3" />
                                Add
                              </div>
                            </button>
                          ) : (
                            <button
                              disabled
                              className="w-full cursor-not-allowed rounded-md bg-gray-300 px-3 py-1.5 text-sm font-medium text-gray-500"
                            >
                              Unavailable
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Customization Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-lg bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedItem.name}</h2>
                  <p className="mt-1 text-gray-600">{selectedItem.description}</p>
                  <p className="mt-2 text-xl font-bold text-indigo-600">
                    {formatPrice(selectedItem.priceCents)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {/* Image */}
              {selectedItem.images?.[0] && (
                <div className="relative mb-6 h-64 overflow-hidden rounded-lg">
                  <Image
                    src={selectedItem.images[0]}
                    alt={selectedItem.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Modifiers */}
              {selectedItem.modifiers && selectedItem.modifiers.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 font-semibold text-gray-900">Customize Your Order</h3>
                  <div className="space-y-2">
                    {selectedItem.modifiers.map((modifier) => (
                      <label
                        key={modifier.name}
                        className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedModifiers.includes(modifier.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedModifiers([...selectedModifiers, modifier.name]);
                              } else {
                                setSelectedModifiers(
                                  selectedModifiers.filter((m) => m !== modifier.name)
                                );
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-medium text-gray-900">{modifier.name}</span>
                        </div>
                        {modifier.priceDelta > 0 && (
                          <span className="text-sm font-medium text-gray-600">
                            +{formatPrice(modifier.priceDelta)}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Notes */}
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-gray-900">Special Instructions</h3>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="e.g., No onions, extra sauce..."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <h3 className="mb-3 font-semibold text-gray-900">Quantity</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="rounded-lg border border-gray-300 p-2 hover:bg-gray-100"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="text-xl font-bold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="rounded-lg border border-gray-300 p-2 hover:bg-gray-100"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t bg-gray-50 p-6">
              <button
                onClick={() => handleAddToCart(selectedItem)}
                className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Add to Cart -{' '}
                {formatPrice(
                  (selectedItem.priceCents +
                    selectedModifiers.reduce((sum, modName) => {
                      const mod = selectedItem.modifiers.find((m) => m.name === modName);
                      return sum + (mod?.priceDelta || 0);
                    }, 0)) *
                    quantity
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black bg-opacity-50" onClick={() => setShowCart(false)}></div>
          <div className="w-full max-w-md overflow-hidden bg-white shadow-xl">
            {/* Cart Header */}
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Your Cart</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <ShoppingCart className="mb-4 h-16 w-16 text-gray-400" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Cart is Empty</h3>
                  <p className="text-gray-600">Add items from the menu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-gray-200 p-4">
                      <div className="flex gap-4">
                        {item.image && (
                          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">
                            {formatPrice(item.priceCents)}
                            {item.modifiers.length > 0 && (
                              <span className="ml-1">
                                + {item.modifiers.map((m) => m.name).join(', ')}
                              </span>
                            )}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateQuantity(item.menuItemId, item.quantity - 1);
                                }
                              }}
                              className="rounded border border-gray-300 p-1 hover:bg-gray-100"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-medium">{item.quantity}</span>
                            <button
                              onClick={() => {
                                updateQuantity(item.menuItemId, item.quantity + 1);
                              }}
                              className="rounded border border-gray-300 p-1 hover:bg-gray-100"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatPrice(
                              (item.priceCents +
                                item.modifiers.reduce((sum, m) => sum + m.priceDelta, 0)) *
                                item.quantity
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {items.length > 0 && (
              <div className="border-t bg-gray-50 p-6">
                <div className="mb-4 flex items-center justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-indigo-600">{formatPrice(getTotalPrice())}</span>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false);
                    router.push(`/checkout/${restaurant.slug}`);
                  }}
                  className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <CustomerMenuPageContent />
    </Suspense>
  );
}
