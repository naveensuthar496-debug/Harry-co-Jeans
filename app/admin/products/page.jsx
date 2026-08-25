'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { money } from '@/lib/format';
import { Plus, Search, Trash2, Edit3, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    loadProducts();
  }, [statusFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const q = search ? `&q=${encodeURIComponent(search)}` : '';
      const st = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const res = await fetch(`/api/admin/products?status=${statusFilter}${q}`);
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id || deleteTarget._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete product');
      setToastMsg(`Deleted ${deleteTarget.title}`);
      setDeleteTarget(null);
      loadProducts();
    } catch (err) {
      alert(err.message || 'Error deleting product');
    } finally {
      setDeleting(false);
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-bold uppercase tracking-wider text-gray-900">CATALOG &middot; PRODUCTS</h1>
        <Link
          href="/admin/products/new"
          className="bg-gray-900 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl hover:bg-black transition flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" /> + Add New Product
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {toastMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {toastMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-display font-extrabold uppercase text-gray-900">ALL PRODUCTS</h2>
            <p className="text-xs text-gray-500">Manage existing flagship editions, add new denim releases, or delete archived items.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU or title..."
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-gray-900"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </form>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-gray-900"
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 font-bold uppercase text-gray-900 border-b border-gray-200">
                <tr>
                  <th className="p-4 w-16">Image</th>
                  <th className="p-4">Product Title &amp; SKU</th>
                  <th className="p-4">Fit / Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Total Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading products from MongoDB Atlas...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-gray-500 font-semibold">No products found. Click "+ Add New Product" to create one.</td></tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id || p._id} className="hover:bg-gray-50 transition group">
                      <td className="p-4">
                        <img
                          src={p.mainImage || p.images?.[0]?.url || 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=100'}
                          alt={p.title}
                          className="w-12 h-16 object-cover rounded-lg bg-gray-100 shadow-sm"
                        />
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-sm text-gray-900 line-clamp-1">{p.title}</p>
                        <p className="text-[11px] font-mono text-gray-500 mt-0.5">{p.sku}</p>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-gray-900 capitalize">{p.fit || 'Classic'}</span>
                        <span className="text-gray-400">&middot; {p.productType || 'Jeans'}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-gray-900">{money(p.basePrice)}</span>
                        {p.compareAtPrice && (
                          <span className="text-[10px] text-gray-400 line-through block">{money(p.compareAtPrice)}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${p.totalStock < 10 ? 'text-amber-600' : 'text-gray-900'}`}>
                          {p.totalStock} units
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'draft' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/edit/${p.id || p._id}`}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900 uppercase">Delete Product?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to permanently delete <strong className="text-gray-900">"{deleteTarget.title}"</strong> from MongoDB Atlas?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white text-xs font-bold uppercase py-3 rounded-xl hover:bg-red-700 transition"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-gray-100 text-gray-900 text-xs font-bold uppercase py-3 rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
