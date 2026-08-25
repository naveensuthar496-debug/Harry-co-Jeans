'use client';

import React, { useState, useEffect } from 'react';
import { money, formatDate } from '@/lib/format';
import { CheckCircle2 } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      const st = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/admin/orders${st}`);
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setToast(`Order status updated to ${newStatus}`);
      setTimeout(() => setToast(''), 3000);
      loadOrders();
    } catch (err) {
      alert(err.message || 'Error updating order');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-bold uppercase tracking-wider text-gray-900">SALES &middot; ORDER FULFILLMENT</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {toast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {toast}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-extrabold uppercase text-gray-900">CUSTOMER ORDERS</h2>
            <p className="text-xs text-gray-500">Inspect incoming orders and update delivery fulfillment status.</p>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none"
          >
            <option value="all">Status: All</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 font-bold uppercase text-gray-900 border-b border-gray-200">
                <tr>
                  <th className="p-4">Order Reference</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Ordered Denim Items</th>
                  <th className="p-4">Total Paid</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading orders...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-gray-500">No orders matching filter.</td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id || o._id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <p className="font-mono font-bold text-gray-900">{o.orderNumber}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(o.placedAt)}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{o.customerName}</p>
                        <p className="text-[11px] text-gray-500">{o.shippingAddress?.phone || o.customerEmail}</p>
                        <p className="text-[10px] text-gray-400">{o.shippingAddress?.city}, {o.shippingAddress?.state}</p>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {(o.items || []).map((it, idx) => (
                            <p key={idx} className="text-gray-800 font-medium">
                              {it.quantity}&times; {it.title} <span className="text-gray-400 font-normal">({it.size})</span>
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 font-black text-sm text-gray-900">{money(o.total)}</td>
                      <td className="p-4">
                        <span className="font-semibold uppercase text-[10px] block text-gray-900">{o.paymentMethod}</span>
                        <span className="text-[10px] text-emerald-700 font-bold">{o.paymentStatus}</span>
                      </td>
                      <td className="p-4">
                        <select
                          value={o.status || 'placed'}
                          onChange={(e) => handleStatusChange(o.id || o._id, e.target.value)}
                          className="bg-gray-100 border border-gray-200 rounded-lg p-2 font-bold text-xs"
                        >
                          <option value="placed">Placed</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
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
