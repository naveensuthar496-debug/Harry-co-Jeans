'use client';

import React, { useState, useEffect } from 'react';
import { money } from '@/lib/format';
import { Users } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/customers')
      .then(r => r.json())
      .then(d => {
        if (d.customers) setCustomers(d.customers);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-bold uppercase tracking-wider text-gray-900">GUILD &middot; CUSTOMER DIRECTORY</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-display font-extrabold uppercase text-gray-900">REGISTERED GUILD MEMBERS</h2>
          <p className="text-xs text-gray-500">View customer accounts and loyalty rewards from MongoDB Atlas.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 font-bold uppercase text-gray-900 border-b border-gray-200">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Loyalty Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading customer records...</td></tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id || c._id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-900">{c.fullName || 'Anonymous'}</td>
                      <td className="p-4 font-semibold">{c.email}</td>
                      <td className="p-4 text-gray-500">{c.phone || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.role === 'admin' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
                          {c.role || 'customer'}
                        </span>
                      </td>
                      <td className="p-4 font-black text-gray-900">{c.loyaltyPoints || 500} pts</td>
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
