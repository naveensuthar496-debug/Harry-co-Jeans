'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { money, formatDate } from '@/lib/format';
import { Package, ShoppingCart, Users, DollarSign, Plus, ArrowRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 4,
    totalCustomers: 0,
    recentOrders: [],
  });

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(d => {
        if (d && !d.error) setSummary(d);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-bold uppercase tracking-wider text-gray-900">STORE DASHBOARD &middot; OVERVIEW</h1>
        <Link
          href="/admin/products/new"
          className="bg-gray-900 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-black transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" /> + Add New Product
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
              <DollarSign className="w-5 h-5 text-gray-900" />
            </div>
            <p className="text-3xl font-black text-gray-900">{money(summary.totalRevenue || 0)}</p>
            <p className="text-[11px] text-emerald-600 font-semibold">&uarr; Live MongoDB data</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <ShoppingCart className="w-5 h-5 text-gray-900" />
            </div>
            <p className="text-3xl font-black text-gray-900">{summary.totalOrders || 0}</p>
            <p className="text-[11px] text-gray-500">Customer checkout orders</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Active Products</span>
              <Package className="w-5 h-5 text-gray-900" />
            </div>
            <p className="text-3xl font-black text-gray-900">{summary.totalProducts || 4}</p>
            <p className="text-[11px] text-gray-500">Flagship denim editions</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-2">
            <div className="flex justify-between items-center text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Customers</span>
              <Users className="w-5 h-5 text-gray-900" />
            </div>
            <p className="text-3xl font-black text-gray-900">{summary.totalCustomers || 1}</p>
            <p className="text-[11px] text-gray-500">Registered guild members</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/products"
            className="bg-gray-900 text-white rounded-2xl p-6 shadow-md hover:bg-black transition flex flex-col justify-between"
          >
            <div>
              <Package className="w-8 h-8 mb-3 text-amber-400" />
              <h3 className="text-lg font-bold uppercase">Catalog &amp; Products</h3>
              <p className="text-xs text-gray-400 mt-1">Add new denim releases, update pricing, or delete products.</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider underline mt-6 flex items-center gap-1">
              Manage Products <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/admin/inventory"
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-gray-900 transition flex flex-col justify-between"
          >
            <div>
              <ShoppingCart className="w-8 h-8 mb-3 text-gray-900" />
              <h3 className="text-lg font-bold uppercase text-gray-900">Inventory Matrix</h3>
              <p className="text-xs text-gray-500 mt-1">Real-time stock across waist sizes 28–38 and quick restock.</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-900 underline mt-6 flex items-center gap-1">
              View Inventory <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-gray-900 transition flex flex-col justify-between"
          >
            <div>
              <Users className="w-8 h-8 mb-3 text-gray-900" />
              <h3 className="text-lg font-bold uppercase text-gray-900">Order Fulfillment</h3>
              <p className="text-xs text-gray-500 mt-1">Inspect receipts, update status, and manage courier tracking.</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-900 underline mt-6 flex items-center gap-1">
              Fulfill Orders <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">RECENT CUSTOMER ORDERS</h3>
            <Link href="/admin/orders" className="text-xs font-bold text-gray-900 underline">View All Orders &rarr;</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 font-bold uppercase text-gray-900">
                <tr>
                  <th className="p-3">Order #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Placed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(summary.recentOrders || []).length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">No orders placed yet.</td></tr>
                ) : (
                  summary.recentOrders.map((o) => (
                    <tr key={o.id || o._id} className="hover:bg-gray-50 transition">
                      <td className="p-3 font-mono font-bold text-gray-900">{o.orderNumber}</td>
                      <td className="p-3 font-semibold">{o.customerName}</td>
                      <td className="p-3 font-bold">{money(o.total)}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded font-bold uppercase text-[9px] bg-gray-100 text-gray-900">{o.status}</span></td>
                      <td className="p-3 text-gray-500">{formatDate(o.placedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
