'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartContext';
import { money } from '@/lib/format';
import { Star, ShieldCheck, Truck, RotateCcw, Check, Sparkles, AlertCircle } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('32');
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    if (params?.slug) {
      fetchProduct(params.slug);
    }
  }, [params?.slug]);

  const fetchProduct = async (slug) => {
    try {
      const res = await fetch(`/api/products/${slug}`);
      const data = await res.json();
      if (data.product) {
        setProduct(data.product);
        if (data.product.variants?.[0]?.size) {
          setSelectedSize(data.product.variants[0].size);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-8 text-center text-gray-500 font-bold uppercase text-xs">
          Loading Denim Studio...
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-8 text-center space-y-4">
          <h2 className="text-2xl font-bold uppercase">Product Not Found</h2>
          <button onClick={() => router.push('/shop')} className="text-xs font-bold underline uppercase">
            Return to Catalog
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const images = product.images?.length ? product.images : [{ url: 'https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=1000' }];
  const currentVariant = product.variants?.find(v => v.size === selectedSize) || product.variants?.[0];
  const stockCount = currentVariant?.stock !== undefined ? currentVariant.stock : 15;

  const handleAddToCart = () => {
    addItem(product, selectedSize, 1);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    addItem(product, selectedSize, 1);
    router.push('/checkout/address');
  };

  return (
    <>
      <Header />
      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-md">
              <img
                src={images[selectedImage]?.url || images[0].url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 shrink-0 transition ${
                      selectedImage === idx ? 'border-gray-900 shadow' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Studio Information */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-mono uppercase font-bold">{product.sku}</span>
                <span className="bg-gray-100 text-gray-900 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">
                  {product.fit || 'Straight'} Fit &middot; {product.gender || 'Unisex'}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-gray-900 uppercase tracking-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-700">
                  {product.rating || '5.0'} ({product.reviewCount || 48} Verified Reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 border-y border-gray-200 py-4">
              <span className="text-3xl font-black text-gray-900">{money(product.basePrice)}</span>
              {product.compareAtPrice && (
                <span className="text-base text-gray-400 line-through">
                  {money(product.compareAtPrice)}
                </span>
              )}
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                Free Express Shipping
              </span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold uppercase tracking-wider text-gray-900">Select Waist Size</span>
                <span className="text-gray-500">True to size &middot; 32" Inseam</span>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {(product.variants || []).map((v) => {
                  const isAvailable = v.stock > 0;
                  const isSelected = selectedSize === v.size;
                  return (
                    <button
                      key={v.size}
                      onClick={() => setSelectedSize(v.size)}
                      disabled={!isAvailable}
                      className={`py-3 rounded-xl text-xs font-bold uppercase transition flex flex-col items-center justify-center border ${
                        isSelected
                          ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                          : isAvailable
                          ? 'bg-white text-gray-900 border-gray-200 hover:border-gray-900'
                          : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed line-through'
                      }`}
                    >
                      <span>{v.size}</span>
                      <span className="text-[9px] font-normal opacity-80">{v.stock} left</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-gray-700">In Stock: {stockCount} units available in Size {selectedSize}</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                className="w-full bg-white border-2 border-gray-900 text-gray-900 text-xs font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-gray-50 transition text-center shadow-sm"
              >
                Add to Shopping Bag
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full bg-gray-900 text-white text-xs font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-black transition text-center shadow-lg"
              >
                Buy Now &middot; Instant Checkout
              </button>
            </div>

            {/* Added Toast Notification */}
            {addedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" /> Added {product.title} (Size {selectedSize}) to bag!
              </div>
            )}

            {/* Craft Specs */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4 text-xs">
              <h3 className="font-bold uppercase text-gray-900 tracking-wider">FIT &amp; CRAFTSMANSHIP DETAILS</h3>
              <ul className="space-y-2 text-gray-600 list-disc list-inside leading-relaxed">
                {(product.fitStyling || []).map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
              {product.fabricCare && (
                <div className="pt-2 border-t border-gray-200 text-gray-500">
                  <span className="font-bold text-gray-900">Fabric &amp; Care: </span>
                  {product.fabricCare}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
