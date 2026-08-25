'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from './CartContext';
import { money } from '@/lib/format';
import { X, ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';

export default function CartDrawer() {
  const { items, isDrawerOpen, setIsDrawerOpen, updateQuantity, removeItem, subtotal } = useCart();

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-900" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">SHOPPING BAG ({items.length})</h2>
            </div>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-900 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 uppercase">Your bag is empty</h3>
                  <p className="text-xs text-gray-500 mt-1">Explore our Japanese raw selvedge denim collection.</p>
                </div>
                <Link
                  href="/shop"
                  onClick={() => setIsDrawerOpen(false)}
                  className="bg-gray-900 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg hover:bg-gray-800 transition"
                >
                  Shop Flagship Denim
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex gap-4 border-b border-gray-100 pb-4">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=300'}
                    alt={item.title}
                    className="w-20 h-24 object-cover rounded-lg bg-gray-50 shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <Link 
                          href={`/product/${item.slug}`} 
                          onClick={() => setIsDrawerOpen(false)}
                          className="font-bold text-xs text-gray-900 hover:underline line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <button 
                          onClick={() => removeItem(item.productId, item.size)}
                          className="text-gray-400 hover:text-red-600 text-xs"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">Size: <span className="font-semibold text-gray-900">{item.size}</span> &middot; {item.color}</p>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-l"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-gray-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-r"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-bold text-xs text-gray-900">{money(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-4">
              <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <p className="text-[11px] text-gray-500">Taxes calculated at checkout. Free shipping across India.</p>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/bag"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-xs font-bold uppercase tracking-wider py-3.5 rounded-lg hover:bg-gray-100 transition text-center"
                >
                  View Bag
                </Link>
                <Link
                  href="/checkout/address"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full bg-gray-900 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-lg hover:bg-black transition text-center flex items-center justify-center gap-1.5 shadow-lg"
                >
                  Checkout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
