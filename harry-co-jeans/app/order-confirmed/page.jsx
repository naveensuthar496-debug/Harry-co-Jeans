'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { money } from '@/lib/format';
import { CheckCircle2, Package, Truck, ArrowRight, Home } from 'lucide-react';

function OrderDetails() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderNumber) {
      fetch(`/api/orders?order=${encodeURIComponent(orderNumber)}`)
        .then(r => r.json())
        .then(d => {
          if (d.order) setOrder(d.order);
        })
        .catch(() => {});
    }
  }, [orderNumber]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-8 text-center max-w-2xl mx-auto">
      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase font-bold tracking-widest text-emerald-700">PAYMENT &amp; ORDER CONFIRMED</span>
        <h1 className="text-3xl font-display font-extrabold text-gray-900 uppercase">
          THANK YOU FOR YOUR ORDER
        </h1>
        <p className="text-xs font-mono text-gray-500 font-bold">
          ORDER REFERENCE: <span className="text-gray-900 text-sm">{orderNumber || '#HC-98241'}</span>
        </p>
      </div>

      {/* Progress Timeline */}
      <div className="border-y border-gray-100 py-6">
        <div className="flex justify-between items-center text-xs font-bold text-gray-900">
          <div className="flex flex-col items-center gap-1">
            <span className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">1</span>
            <span className="text-[10px] uppercase">Placed</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-900 mx-2" />
          <div className="flex flex-col items-center gap-1">
            <span className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">2</span>
            <span className="text-[10px] uppercase">Confirmed</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
          <div className="flex flex-col items-center gap-1">
            <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs">3</span>
            <span className="text-[10px] uppercase text-gray-400">Crafting</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
          <div className="flex flex-col items-center gap-1">
            <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs">4</span>
            <span className="text-[10px] uppercase text-gray-400">Shipped</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
        Your raw Japanese selvedge denim order has been sent to our atelier team. You will receive an SMS and email dispatch notification with express air tracking.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          href="/"
          className="w-full sm:w-auto bg-gray-900 text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl hover:bg-black transition flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" /> Return to Storefront
        </Link>
        <Link
          href="/shop"
          className="w-full sm:w-auto bg-gray-100 text-gray-900 text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
        >
          Continue Browsing <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <>
      <Header />
      <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-8">
        <Suspense fallback={<div className="text-center py-20 text-xs uppercase font-bold text-gray-400">Loading Order Confirmation...</div>}>
          <OrderDetails />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
