'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/AuthContext';
import { User, Award, Package, MapPin, LogOut } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-32 pb-20 text-center text-xs font-bold uppercase text-gray-400">Loading Account...</main>
        <Footer />
      </>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <Header />
      <main className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-gray-500">MEMBER PROFILE</span>
            <h1 className="text-3xl font-display font-extrabold uppercase text-gray-900">
              WELCOME, {user.fullName || 'DENIM ENTHUSIAST'}
            </h1>
          </div>
          <button
            onClick={async () => { await logout(); router.push('/'); }}
            className="flex items-center gap-1.5 text-xs font-bold uppercase text-red-600 hover:text-red-800 transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* Loyalty & Account Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-gray-500">
              <span className="text-xs font-bold uppercase">Loyalty Tier</span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-gray-900">Indigo Member</p>
            <p className="text-xs text-gray-500">{user.loyaltyPoints || 500} Atelier Points</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-gray-500">
              <span className="text-xs font-bold uppercase">Account Email</span>
              <User className="w-5 h-5 text-gray-900" />
            </div>
            <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
            <p className="text-xs text-emerald-600 font-semibold">Verified Member</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-gray-500">
              <span className="text-xs font-bold uppercase">Complimentary Benefits</span>
              <Package className="w-5 h-5 text-gray-900" />
            </div>
            <p className="text-sm font-bold text-gray-900">Free Chainstitch Hemming</p>
            <p className="text-xs text-gray-500">Lifetime Guild Repairs</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-900 text-white rounded-2xl p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-xl font-bold uppercase">BROWSE THE 4 FLAGSHIP RELEASES</h3>
            <p className="text-xs text-gray-400">Discover Kaihara raw denim and Kuroki sulfur black cuts.</p>
          </div>
          <Link
            href="/shop"
            className="bg-white text-gray-950 text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-gray-200 transition"
          >
            Shop Flagship Jeans
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
