'use client';

import React, { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    storeName: 'HARRY & CO JEANS',
    supportEmail: 'care@hcjeans.com',
    contactPhone: '+91 8000 123 456',
    address: 'Studio 4, Indiranagar, Bengaluru, KA 560038, India',
    currency: 'INR (₹)',
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-bold uppercase tracking-wider text-gray-900">SETTINGS &middot; STORE CONFIGURATION</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-6 max-w-3xl">
        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Store preferences updated successfully.
          </div>
        )}

        <div>
          <h2 className="text-2xl font-display font-extrabold uppercase text-gray-900">STORE PREFERENCES</h2>
          <p className="text-xs text-gray-500">Configure brand profile, contact info, and atelier address.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Store Name</label>
            <input
              type="text"
              value={form.storeName}
              onChange={(e) => setForm({ ...form, storeName: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Support Email</label>
              <input
                type="email"
                value={form.supportEmail}
                onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Phone Number</label>
              <input
                type="text"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Atelier Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Base Currency</label>
            <input
              type="text"
              readOnly
              value={form.currency}
              className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 text-xs font-bold text-gray-500"
            />
          </div>

          <button
            type="submit"
            className="bg-gray-900 text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl hover:bg-black transition flex items-center gap-2 shadow"
          >
            <Save className="w-4 h-4" /> Save Preferences
          </button>
        </form>
      </main>
    </div>
  );
}
