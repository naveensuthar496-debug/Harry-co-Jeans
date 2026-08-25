'use client';

import React, { useState, useEffect } from 'react';
import { money } from '@/lib/format';
import { Save, CheckCircle2 } from 'lucide-react';

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const res = await fetch('/api/admin/inventory');
      const data = await res.json();
      if (data.inventory) setInventory(data.inventory);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = (idx, newStock) => {
    const updated = [...inventory];
    updated[idx].stock = Number(newStock) || 0;
    setInventory(updated);
  };

  const updateItemStock = async (item) => {
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.productId, size: item.size, stock: item.stock }),
      });
      if (!res.ok) throw new Error('Failed to update stock');
      setToast(`Updated stock for ${item.productName} (Size ${item.size}) to ${item.stock}`);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.message || 'Error updating stock');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-bold uppercase tracking-wider text-gray-900">INVENTORY &middot; SKU STOCK MATRIX</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {toast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {toast}
          </div>
        )}

        <div>
          <h2 className="text-2xl font-display font-extrabold uppercase text-gray-900">REAL-TIME STOCK MATRIX</h2>
          <p className="text-xs text-gray-500">Live inventory across sizes. Edit counts directly and click update.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 font-bold uppercase text-gray-900 border-b border-gray-200">
                <tr>
                  <th className="p-4 w-12"></th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Color</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-400">Loading inventory from MongoDB...</td></tr>
                ) : inventory.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-400">No inventory variants available.</td></tr>
                ) : (
                  inventory.map((item, idx) => (
                    <tr key={`${item.productId}-${item.size}`} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <img src={item.imageUrl} alt="" className="w-8 h-10 object-cover rounded bg-gray-100" />
                      </td>
                      <td className="p-4 font-mono font-bold text-gray-900">{item.sku}</td>
                      <td className="p-4 font-semibold text-gray-900">{item.productName}</td>
                      <td className="p-4 font-black text-gray-900">{item.size}</td>
                      <td className="p-4 text-gray-500">{item.color}</td>
                      <td className="p-4 font-bold">{money(item.price)}</td>
                      <td className="p-4">
                        <input
                          type="number"
                          value={item.stock}
                          onChange={(e) => handleStockChange(idx, e.target.value)}
                          className={`w-20 bg-gray-50 border border-gray-200 rounded-lg p-1.5 font-bold text-xs ${item.stock < 10 ? 'text-amber-600' : 'text-gray-900'}`}
                        />
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => updateItemStock(item)}
                          className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase hover:bg-black transition flex items-center gap-1 ml-auto"
                        >
                          <Save className="w-3.5 h-3.5" /> Update
                        </button>
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
