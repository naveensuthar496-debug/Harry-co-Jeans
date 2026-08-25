'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    sku: '',
    slug: '',
    fit: 'straight',
    productType: 'Jeans',
    gender: 'unisex',
    description: '',
    basePrice: '',
    compareAtPrice: '',
    status: 'active',
    isNew: true,
    imageUrl: '',
    fabricCare: '',
    fitStyling: '',
    tags: '',
  });

  const [variants, setVariants] = useState([
    { size: '28', color: 'Raw Indigo', price: '', stock: 10 },
    { size: '30', color: 'Raw Indigo', price: '', stock: 10 },
    { size: '32', color: 'Raw Indigo', price: '', stock: 10 },
    { size: '34', color: 'Raw Indigo', price: '', stock: 10 },
    { size: '36', color: 'Raw Indigo', price: '', stock: 10 },
    { size: '38', color: 'Raw Indigo', price: '', stock: 10 },
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleVariantChange = (idx, field, value) => {
    const updated = [...variants];
    updated[idx][field] = value;
    setVariants(updated);
  };

  const addVariantRow = () => {
    setVariants(prev => [...prev, { size: '40', color: 'Raw Indigo', price: Number(form.basePrice) || 0, stock: 10 }]);
  };

  const removeVariantRow = (idx) => {
    setVariants(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.basePrice) {
      alert('Product title and base price are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        basePrice: Number(form.basePrice),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        fitStyling: form.fitStyling.split('\n').map(s => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        images: form.imageUrl ? [{ url: form.imageUrl.trim(), isMain: true }] : [],
        variants: variants.map(v => ({
          ...v,
          price: Number(v.price) || Number(form.basePrice),
          stock: Number(v.stock) || 0,
        })),
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');

      alert('Product created and published to MongoDB Atlas!');
      router.push('/admin/products');
    } catch (err) {
      alert(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
        <Link href="/admin/products" className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-gray-900 text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl hover:bg-black transition flex items-center gap-1.5 shadow"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Publish'}
        </button>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-gray-500">PRODUCT STUDIO</span>
          <h1 className="text-2xl font-display font-extrabold uppercase text-gray-900">ADD NEW PRODUCT</h1>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3">
                GENERAL INFORMATION
              </h2>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Product Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. The 1968 Vintage Straight Selvedge"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="e.g. HC-VSS-005"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono font-bold focus:outline-none focus:border-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">URL Slug</label>
                  <input
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    placeholder="e.g. vintage-straight-selvedge"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Fit Silhouette</label>
                  <select
                    name="fit"
                    value={form.fit}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
                  >
                    <option value="straight">Straight Fit</option>
                    <option value="slim">Slim Tapered</option>
                    <option value="relaxed">Relaxed Fit</option>
                    <option value="baggy">Baggy Wide-Leg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Category</label>
                  <select
                    name="productType"
                    value={form.productType}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
                  >
                    <option value="Jeans">Jeans</option>
                    <option value="Jackets">Jackets</option>
                    <option value="Shirts">Shirts</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Gender</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
                  >
                    <option value="unisex">Unisex</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Full Description</label>
                <textarea
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Enter product description, fabric origin, and craftsmanship details..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Fabric &amp; Care Details</label>
                <input
                  type="text"
                  name="fabricCare"
                  value={form.fabricCare}
                  onChange={handleChange}
                  placeholder="e.g. 14oz 100% Raw Cotton. Wash inside out in cold water after 6 months."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Fit &amp; Styling Highlights (one per line)</label>
                <textarea
                  name="fitStyling"
                  rows={3}
                  value={form.fitStyling}
                  onChange={handleChange}
                  placeholder="Mid-rise classic straight leg&#10;Button fly with brass hardware&#10;Red-line selvedge ticker"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="e.g. selvedge, raw denim, japan, new release"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-gray-900"
                />
              </div>
            </div>

            {/* Media Image */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> PRODUCT PHOTOGRAPHY
              </h2>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Main Image URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
                />
              </div>
              {form.imageUrl && (
                <div className="w-24 aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Variants Matrix */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                  SIZES &amp; STOCK MATRIX
                </h2>
                <button
                  type="button"
                  onClick={addVariantRow}
                  className="text-xs font-bold uppercase text-gray-900 underline"
                >
                  + Add Size
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 font-bold uppercase text-gray-900">
                    <tr>
                      <th className="p-2.5">Waist Size</th>
                      <th className="p-2.5">Color Wash</th>
                      <th className="p-2.5">Price (₹)</th>
                      <th className="p-2.5">Stock Count</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {variants.map((v, i) => (
                      <tr key={i}>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={v.size}
                            onChange={(e) => handleVariantChange(i, 'size', e.target.value)}
                            placeholder="32"
                            className="w-16 bg-gray-50 border border-gray-200 rounded-lg p-1.5 font-bold text-center"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={v.color}
                            onChange={(e) => handleVariantChange(i, 'color', e.target.value)}
                            placeholder="Color / Wash"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => handleVariantChange(i, 'price', e.target.value)}
                            placeholder={form.basePrice || "₹ Price"}
                            className="w-24 bg-gray-50 border border-gray-200 rounded-lg p-1.5 font-bold"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => handleVariantChange(i, 'stock', e.target.value)}
                            className="w-20 bg-gray-50 border border-gray-200 rounded-lg p-1.5 font-bold text-center"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => removeVariantRow(i)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar Settings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 sticky top-24">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3">
                PRICING &amp; VISIBILITY
              </h2>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Base Price (INR ₹) *</label>
                <input
                  type="number"
                  name="basePrice"
                  required
                  value={form.basePrice}
                  onChange={handleChange}
                  placeholder="e.g. 4990"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg font-black text-gray-900 focus:outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Compare Price (₹)</label>
                <input
                  type="number"
                  name="compareAtPrice"
                  value={form.compareAtPrice}
                  onChange={handleChange}
                  placeholder="e.g. 6490"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-gray-900"
                >
                  <option value="active">Active (Visible in Store)</option>
                  <option value="draft">Draft (Hidden)</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isNew"
                    checked={form.isNew}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-gray-900 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-gray-900">Mark as "NEW" Release</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gray-900 text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-black transition shadow-lg mt-4"
              >
                {saving ? 'Creating Product...' : 'Publish to MongoDB'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
