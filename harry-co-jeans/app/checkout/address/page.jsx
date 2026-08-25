'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartContext';
import { useAuth } from '@/components/AuthContext';
import { money } from '@/lib/format';
import { MapPin, ArrowRight } from 'lucide-react';

export default function CheckoutAddressPage() {
  const router = useRouter();
  const { items, subtotal } = useCart();
  const { user } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    line1: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hc_shipping_address');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setForm(prev => ({ ...prev, ...parsed }));
            return;
          }
        } catch {}
      }
    }
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('hc_shipping_address', JSON.stringify(form));
    }
    router.push('/checkout/payment');
  };

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="pt-32 pb-20 max-w-xl mx-auto px-4 text-center space-y-4">
          <h2 className="text-xl font-bold uppercase">Your Bag is Empty</h2>
          <button onClick={() => router.push('/shop')} className="text-xs font-bold underline uppercase">
            Browse Flagship Denim
          </button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-8 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-gray-500">STEP 1 OF 2</span>
          <h1 className="text-3xl font-display font-extrabold text-gray-900 uppercase">SHIPPING ADDRESS</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> DELIVERY DESTINATION
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@domain.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Street Address *</label>
              <input
                type="text"
                name="line1"
                required
                value={form.line1}
                onChange={handleChange}
                placeholder="House / Flat / Block No., Street Name"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">State *</label>
                <input
                  type="text"
                  name="state"
                  required
                  value={form.state}
                  onChange={handleChange}
                  placeholder="State"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">PIN Code *</label>
                <input
                  type="text"
                  name="zip"
                  required
                  value={form.zip}
                  onChange={handleChange}
                  placeholder="PIN code"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3">
              BAG SUMMARY ({items.length})
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Express Shipping</span>
                <span className="text-emerald-700 font-bold">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>{money(Math.round(subtotal * 0.05))}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-gray-900 pt-3 border-t border-gray-100">
                <span>Total</span>
                <span>{money(subtotal + Math.round(subtotal * 0.05))}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gray-900 text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-black transition text-center flex items-center justify-center gap-2 shadow-lg"
            >
              Continue to Payment <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </>
  );
}
