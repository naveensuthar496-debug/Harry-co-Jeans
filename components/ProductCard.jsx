'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from './CartContext';
import { money } from '@/lib/format';
import { ShoppingBag, Star } from 'lucide-react';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const mainImage = product.mainImage || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=600';
  const secondaryImage = product.images?.[1]?.url || mainImage;

  return (
    <div className="group relative bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Image Container */}
        <Link href={`/product/${product.slug}`} className="block relative aspect-[3/4] bg-gray-100 overflow-hidden">
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow">
                NEW
              </span>
            )}
            <span className="bg-white/90 backdrop-blur text-gray-900 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-sm">
              {product.fit || 'Straight'} Fit
            </span>
          </div>

          {product.compareAtPrice && (
            <div className="absolute top-3 right-3">
              <span className="bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow">
                Save {Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)}%
              </span>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="p-5 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span className="font-mono">{product.sku}</span>
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{product.rating || '5.0'}</span>
            </div>
          </div>

          <Link href={`/product/${product.slug}`} className="block font-bold text-sm text-gray-900 group-hover:text-gray-600 transition line-clamp-1">
            {product.title}
          </Link>

          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Pricing & Quick Add */}
      <div className="p-5 pt-0 flex items-center justify-between border-t border-gray-100 mt-2">
        <div>
          <span className="text-base font-extrabold text-gray-900">{money(product.basePrice)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-gray-400 line-through block font-normal">
              {money(product.compareAtPrice)}
            </span>
          )}
        </div>

        <button
          onClick={() => addItem(product, product.variants?.[0]?.size || '32', 1)}
          className="bg-gray-900 text-white p-2.5 rounded-xl hover:bg-black transition shadow flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider group-hover:bg-primary"
          title="Add to Shopping Bag"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
    </div>
  );
}
