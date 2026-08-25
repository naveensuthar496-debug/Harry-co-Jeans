'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hc_cart');
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hc_cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = (product, size = '32', quantity = 1) => {
    setItems(prev => {
      const existingIdx = prev.findIndex(i => (i.productId === product.id || i.productId === product._id) && i.size === size);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, {
        productId: product.id || product._id,
        slug: product.slug,
        title: product.title,
        price: product.basePrice,
        image: product.mainImage || product.images?.[0]?.url,
        size,
        color: product.variants?.[0]?.color || 'Raw Indigo',
        quantity,
      }];
    });
    setIsDrawerOpen(true);
  };

  const updateQuantity = (productId, size, quantity) => {
    setItems(prev => {
      if (quantity <= 0) {
        return prev.filter(i => !(i.productId === productId && i.size === size));
      }
      return prev.map(i => (i.productId === productId && i.size === size) ? { ...i, quantity } : i);
    });
  };

  const removeItem = (productId, size) => {
    setItems(prev => prev.filter(i => !(i.productId === productId && i.size === size)));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      subtotal,
      totalItems,
      isDrawerOpen,
      setIsDrawerOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
