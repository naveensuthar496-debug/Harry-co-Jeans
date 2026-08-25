import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { getProducts } from '@/lib/models';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Sparkles, Feather } from 'lucide-react';

export const revalidate = 0; // Dynamic on every request

export default async function HomePage() {
  const products = await getProducts({ status: 'active', limit: 4 });

  return (
    <>
      <Header />
      <main className="pt-24 pb-16">
        {/* HERO SECTION */}
        <section className="relative min-h-[85vh] flex items-center justify-center bg-gray-950 text-white overflow-hidden">
          {/* Background overlay with denim texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-gray-950 to-black opacity-90" />
          
          <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-8 py-20">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-gray-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>THE 2026 RAW DENIM ARCHIVE</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight uppercase leading-none">
              RAW. HEAVY. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-gray-400">
                UNCOMPROMISING.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-300 font-normal leading-relaxed">
              Makers of heavyweight Japanese selvedge denim. Woven slowly at low tension on vintage Toyoda shuttle looms in Okayama and Hiroshima.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/shop"
                className="w-full sm:w-auto bg-white text-gray-950 px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition shadow-2xl flex items-center justify-center gap-2"
              >
                Shop 4 Flagship Editions <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/selvedge"
                className="w-full sm:w-auto bg-transparent border border-white/30 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition flex items-center justify-center"
              >
                The Selvedge Craft
              </Link>
            </div>
          </div>
        </section>

        {/* 4 FLAGSHIP PRODUCTS SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20 space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-gray-500">THE ESSENTIAL FOUR</span>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-gray-900 tracking-tight mt-1">
                FLAGSHIP EDITIONS
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold uppercase tracking-wider text-gray-900 hover:text-gray-600 flex items-center gap-1.5"
            >
              View Full Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id || product._id} product={product} />
            ))}
          </div>
        </section>

        {/* SHOP BY FIT SILHOUETTE */}
        <section className="bg-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs uppercase tracking-widest font-bold text-gray-500">SIGNATURE SILHOUETTES</span>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-gray-900 mt-1 uppercase">
                CURATED FIT ARCHIVES
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Link href="/shop?fit=straight" className="group relative h-80 rounded-2xl overflow-hidden shadow bg-gray-900">
                <img
                  src="https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=800"
                  alt="Straight Fit"
                  className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">14oz Kaihara</span>
                  <h3 className="text-xl font-bold uppercase">The Vintage Straight</h3>
                  <p className="text-xs text-gray-300 mt-1">Mid-rise classic straight leg from hip to hem.</p>
                </div>
              </Link>

              <Link href="/shop?fit=slim" className="group relative h-80 rounded-2xl overflow-hidden shadow bg-gray-900">
                <img
                  src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800"
                  alt="Slim Fit"
                  className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">13.5oz Kuroki</span>
                  <h3 className="text-xl font-bold uppercase">The Chelsea Tapered</h3>
                  <p className="text-xs text-gray-300 mt-1">Roomy thigh tapering sharply to the ankle.</p>
                </div>
              </Link>

              <Link href="/shop?fit=baggy" className="group relative h-80 rounded-2xl overflow-hidden shadow bg-gray-900">
                <img
                  src="https://images.unsplash.com/photo-1555689502-c4b22d76c56f?q=80&w=800"
                  alt="Wide-Leg Fit"
                  className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">15oz Kurabo</span>
                  <h3 className="text-xl font-bold uppercase">The Shibuya Wide-Leg</h3>
                  <p className="text-xs text-gray-300 mt-1">Authentic heavyweight streetwear volume.</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ATELIER CRAFTSMANSHIP STORY */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-widest font-bold text-red-700">OKAYAMA &amp; HIROSHIMA MILLS</span>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-gray-900 leading-tight">
              WOVEN SLOWLY ON 1960s TOYODA SHUTTLE LOOMS
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Unlike modern high-speed projectile looms that churn out flat, homogenized fabric, our denim is produced on vintage shuttle looms operating at just 120 picks per minute.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              This slow, low-tension weaving creates an unmistakable slub texture, authentic self-finished red-line edges, and high-contrast honeycombs as you break them in over months of wear.
            </p>

            <div className="pt-2">
              <Link
                href="/selvedge"
                className="inline-flex items-center gap-2 bg-gray-900 text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 rounded-xl hover:bg-black transition shadow-md"
              >
                Explore Shuttle Loom Weaving <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=1000"
              alt="Japanese Selvedge Loom"
              className="w-full h-[450px] object-cover"
            />
          </div>
        </section>

        {/* TRUST FEATURES */}
        <section className="border-t border-gray-200 bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900 shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 uppercase">Complimentary Express</h4>
                <p className="text-xs text-gray-500">Air shipping across India on all orders.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 uppercase">Lifetime Guild Repairs</h4>
                <p className="text-xs text-gray-500">Free crotch blowout &amp; chainstitch repairs.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-900 shrink-0">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900 uppercase">14-Day Free Exchange</h4>
                <p className="text-xs text-gray-500">Effortless sizing swaps at your doorstep.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
