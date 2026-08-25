'use client';

import React, { useState, useEffect } from 'react';
import { money } from '@/lib/format';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Package } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    productBreakdown: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(d => {
        if (d && !d.error) setSummary(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const aov = summary.totalOrders > 0 ? Math.round(summary.totalRevenue / summary.totalOrders) : 0;
  const breakdown = summary.productBreakdown || [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-bold uppercase tracking-wider text-gray-900">SALES &middot; PERFORMANCE ANALYTICS</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        <div>
          <h2 className="text-2xl font-display font-extrabold uppercase text-gray-900">COMMERCIAL METRICS</h2>
          <p className="text-xs text-gray-500">Real-time revenue and sales breakdown based on customer orders.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase text-gray-500">Gross Sales</span>
            <p className="text-3xl font-black text-gray-900">{money(summary.totalRevenue || 0)}</p>
            <p className="text-xs text-emerald-600 font-semibold">&uarr; Real-time customer checkouts</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase text-gray-500">Total Orders</span>
            <p className="text-3xl font-black text-gray-900">{summary.totalOrders || 0}</p>
            <p className="text-xs text-gray-500">Average Order Value: <strong className="text-gray-900">{money(aov)}</strong></p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
            <span className="text-xs font-bold uppercase text-gray-500">Active Products</span>
            <p className="text-3xl font-black text-gray-900">{summary.totalProducts || 0} Editions</p>
            <p className="text-xs text-emerald-600 font-semibold">Active in Catalog</p>
          </div>
        </div>

        {/* Denim Sales Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3">
            PRODUCT SALES DISTRIBUTION
          </h3>

          {loading ? (
            <p className="text-xs text-gray-400">Loading sales analytics...</p>
          ) : breakdown.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 space-y-1">
              <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="font-semibold text-gray-500">No customer orders recorded yet.</p>
              <p>Product sales charts and revenue distribution will populate automatically when customers complete checkout.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {breakdown.map((item, idx) => {
                const percentage = summary.totalRevenue > 0
                  ? Math.round((item.revenue / summary.totalRevenue) * 100)
                  : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{item.title} ({item.count} units sold)</span>
                      <span>{percentage}% ({money(item.revenue)})</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
