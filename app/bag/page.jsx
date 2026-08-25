'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartContext';
import { money } from '@/lib/format';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag } from 'lucide-react';

export default function BagPage() {
  const { items, updateQuantity, removeItem, subtotal, totalItems } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(null);

  const applyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'WELCOME10') {
      const disc = Math.round(subtotal * 0.1);
      setDiscount(disc);
      setCouponApplied('WELCOME10 (10% Off Applied)');
    } else if (code === 'DENIM500') {
      const disc = Math.min(500, subtotal);
      setDiscount(disc);
      setCouponApplied('DENIM500 (₹500 Atelier Credit Applied)');
    } else {
      alert('Invalid coupon code. Try WELCOME10 or DENIM500');
    }
  };

  const shipping = 0;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + shipping + tax;

  return (
    <>
      <Header />
      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-gray-500">YOUR CART</span>
          <h1 className="text-3xl font-display font-extrabold text-gray-900 uppercase">SHOPPING BAG ({totalItems})</h1>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
            <h2 className="text-xl font-bold uppercase text-gray-900">Your shopping bag is empty</h2>
            <p className="text-xs text-gray-500">Discover our authentic 4 flagship denim editions.</p>
            <Link
              href="/shop"
              className="inline-block bg-gray-900 text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl hover:bg-black transition"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Bag Items */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm divide-y divide-gray-100">
              {items.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="py-6 first:pt-0 last:pb-0 flex gap-6">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-24 h-32 object-cover rounded-xl bg-gray-50 shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <Link href={`/product/${item.slug}`} className="font-bold text-sm text-gray-900 hover:underline">
                          {item.title}
                        </Link>
                        <button
                          onClick={() => removeItem(item.productId, item.size)}
                          className="text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Waist Size: <span className="font-bold text-gray-900">{item.size}</span> &middot; {item.color}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-l"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-4 text-xs font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-r"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-base font-extrabold text-gray-900">{money(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Box */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3">
                  ORDER SUMMARY
                </h3>

                {/* Promo Code Form */}
                <form onSubmit={applyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo Code (WELCOME10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold uppercase focus:outline-none focus:border-gray-900"
                  />
                  <button type="submit" className="bg-gray-900 text-white text-xs font-bold uppercase px-4 py-2 rounded-lg hover:bg-black">
                    Apply
                  </button>
                </form>

                {couponApplied && (
                  <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> {couponApplied}
                  </p>
                )}

                <div className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900">{money(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount</span>
                      <span>-{money(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Express Air Shipping</span>
                    <span className="font-bold text-emerald-700">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated GST (5%)</span>
                    <span>{money(tax)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-gray-900 pt-3 border-t border-gray-100">
                    <span>Total Amount</span>
                    <span>{money(total)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout/address"
                  className="w-full bg-gray-900 text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-black transition text-center flex items-center justify-center gap-2 shadow-lg"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
