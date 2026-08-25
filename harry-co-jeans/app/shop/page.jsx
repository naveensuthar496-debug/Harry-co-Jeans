import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/models';
import Link from 'next/link';

export const revalidate = 0;

export default async function ShopPage({ searchParams }) {
  const params = await searchParams;
  const fit = params?.fit || 'all';
  const productType = params?.productType || 'all';
  const sort = params?.sort || 'default';
  const q = params?.q || '';

  const products = await getProducts({ fit, productType, sort, q, status: 'active' });

  return (
    <>
      <Header />
      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-gray-500">JAPANESE RAW SELVEDGE ARCHIVE</span>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-gray-900 uppercase tracking-tight">
            FLAGSHIP DENIM COLLECTION
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Slowly woven 13.5oz–15oz raw denim crafted from Kaihara, Kuroki, Kurabo, and Candiani mills.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          {/* Fit Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <Link
              href="/shop"
              className={`px-4 py-2 rounded-xl transition ${fit === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All Fits
            </Link>
            <Link
              href="/shop?fit=straight"
              className={`px-4 py-2 rounded-xl transition ${fit === 'straight' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Straight (14oz)
            </Link>
            <Link
              href="/shop?fit=slim"
              className={`px-4 py-2 rounded-xl transition ${fit === 'slim' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Slim Tapered (13.5oz)
            </Link>
            <Link
              href="/shop?fit=baggy"
              className={`px-4 py-2 rounded-xl transition ${fit === 'baggy' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Wide-Leg Rigid (15oz)
            </Link>
            <Link
              href="/shop?productType=Jackets"
              className={`px-4 py-2 rounded-xl transition ${productType === 'Jackets' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Jackets
            </Link>
          </div>

          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Showing {products.length} Products
          </div>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 uppercase">No products found matching filters</h3>
            <p className="text-xs text-gray-500">Try selecting "All Fits" or clearing your search.</p>
            <Link href="/shop" className="inline-block text-xs font-bold uppercase underline text-gray-900 pt-2">
              View All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
