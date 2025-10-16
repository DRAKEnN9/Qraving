'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartModifier {
  name: string;
  priceDelta: number;
}

interface CartItem {
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
  modifiers: CartModifier[];
  image?: string;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  restaurantId: string | null;
  setRestaurantId: (id: string) => void;
  tableNumber: number | null;
  setTableNumber: (num: number | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedRestaurantId = localStorage.getItem('cartRestaurantId');
    const savedTableNumber = localStorage.getItem('tableNumber');

    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
    if (savedRestaurantId) {
      setRestaurantId(savedRestaurantId);
    }
    if (savedTableNumber) {
      setTableNumber(parseInt(savedTableNumber));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (restaurantId) {
      localStorage.setItem('cartRestaurantId', restaurantId);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (tableNumber !== null) {
      localStorage.setItem('tableNumber', tableNumber.toString());
    }
  }, [tableNumber]);

  const addItem = (newItem: CartItem) => {
    setItems((prevItems) => {
      // Check if item with same modifiers already exists
      const existingIndex = prevItems.findIndex(
        (item) =>
          item.menuItemId === newItem.menuItemId &&
          JSON.stringify(item.modifiers) === JSON.stringify(newItem.modifiers)
      );

      if (existingIndex > -1) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        updatedItems[existingIndex].quantity += newItem.quantity;
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, newItem];
      }
    });
  };

  const removeItem = (menuItemId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.menuItemId === menuItemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setTableNumber(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('cartRestaurantId');
    localStorage.removeItem('tableNumber');
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      const modifiersTotal = item.modifiers.reduce(
        (sum, mod) => sum + mod.priceDelta,
        0
      );
      return total + (item.priceCents + modifiersTotal) * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        restaurantId,
        setRestaurantId,
        tableNumber,
        setTableNumber,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
