'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { ShoppingBag, User, Menu, X, Shield, Sparkles } from 'lucide-react';

export default function Header() {
  const { totalItems, setIsDrawerOpen } = useCart();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
      {/* Top Banner */}
      <div className="bg-gray-900 text-white text-[11px] font-semibold tracking-widest text-center py-1.5 uppercase flex items-center justify-center gap-2">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>COMPLIMENTARY EXPRESS SHIPPING &middot; 100% RAW JAPANESE SELVEDGE DENIM</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Left Nav */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-gray-900">
            <Link href="/shop" className="hover:text-gray-600 transition">Shop All</Link>
            <Link href="/shop?fit=straight" className="hover:text-gray-600 transition">Straight</Link>
            <Link href="/shop?fit=slim" className="hover:text-gray-600 transition">Slim</Link>
            <Link href="/shop?fit=baggy" className="hover:text-gray-600 transition">Wide-Leg</Link>
            <Link href="/selvedge" className="text-red-700 hover:text-red-800 transition">The Selvedge Story</Link>
          </nav>
        </div>

        {/* Center Logo */}
        <Link href="/" className="text-xl sm:text-2xl font-display font-extrabold tracking-tighter uppercase text-gray-900">
          HARRY &amp; CO
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Admin Link if staff */}
          {user?.role === 'admin' ? (
            <Link 
              href="/admin/dashboard" 
              className="bg-gray-900 text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-black transition"
            >
              <Shield className="w-3 h-3" /> Admin
            </Link>
          ) : (
            <Link 
              href="/admin/login" 
              className="text-gray-400 hover:text-gray-900 p-1.5 rounded-lg transition"
              title="Admin Login"
            >
              <Shield className="w-4 h-4" />
            </Link>
          )}

          <Link href={user ? '/account' : '/login'} className="p-1.5 text-gray-900 hover:text-gray-600 rounded-lg transition">
            <User className="w-5 h-5" />
          </Link>

          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="relative p-1.5 text-gray-900 hover:text-gray-600 rounded-lg transition"
          >
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-6 py-4 space-y-3 text-xs font-bold uppercase tracking-wider">
          <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="block py-2">Shop All Flagships</Link>
          <Link href="/shop?fit=straight" onClick={() => setMobileMenuOpen(false)} className="block py-2">Straight Fit</Link>
          <Link href="/shop?fit=slim" onClick={() => setMobileMenuOpen(false)} className="block py-2">Slim Tapered</Link>
          <Link href="/shop?fit=baggy" onClick={() => setMobileMenuOpen(false)} className="block py-2">Baggy Wide-Leg</Link>
          <Link href="/selvedge" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-red-700">The Selvedge Story</Link>
          <Link href="/help" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-500">Denim Care &amp; Sizing</Link>
        </div>
      )}
    </header>
  );
}
