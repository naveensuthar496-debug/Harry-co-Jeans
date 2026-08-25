import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowRight, Sparkles, Feather } from 'lucide-react';

export default function SelvedgeLookbookPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-20 space-y-20">
        {/* Cover Hero */}
        <section className="relative min-h-[60vh] flex items-center justify-center bg-gray-950 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/60 z-10" />
          <img
            src="https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=1800"
            alt="Toyoda Loom"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="relative z-20 text-center max-w-3xl mx-auto px-4 space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest text-red-500">THE SELVEDGE CHRONICLES</span>
            <h1 className="text-4xl sm:text-6xl font-display font-extrabold uppercase tracking-tight">
              THE ART OF THE SHUTTLE LOOM
            </h1>
            <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto">
              How slow, low-tension Japanese weaving creates the most characterful denim in the world.
            </p>
          </div>
        </section>

        {/* 3 Pillars of Japanese Denim */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">CHAPTER 01</span>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-gray-900">
                16-DIP ROPE DYEING
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Before cotton yarn reaches the shuttle loom, it is formed into thick ropes and submerged into pure synthetic or natural indigo vats up to 16 separate times.
              </p>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Because indigo cannot penetrate all the way into the yarn core, the center remains pristine white. As the surface indigo chips away with friction, you get stunning, sharp fading contrasts.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg aspect-[4/3] bg-gray-100">
              <img src="https://images.unsplash.com/photo-1542272604-780c96856592?q=80&w=800" alt="Indigo dye" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
            <div className="order-2 md:order-1 rounded-2xl overflow-hidden shadow-lg aspect-[4/3] bg-gray-100">
              <img src="https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800" alt="Selvedge Edge" className="w-full h-full object-cover" />
            </div>
            <div className="order-1 md:order-2 space-y-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">CHAPTER 02</span>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold uppercase text-gray-900">
                SELF-FINISHED RED-LINE ID
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                A shuttle loom carries weft yarn back and forth across the warp on a wooden shuttle, looping continuously at both edges to form a clean, self-finished border ("self-edge" or selvedge).
              </p>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Our signature red-line ticker is visible whenever you cuff your jeans, certifying authentic shuttle-woven origin.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gray-900 text-white py-16 text-center">
          <div className="max-w-xl mx-auto px-4 space-y-6">
            <h3 className="text-2xl font-bold uppercase">EXPERIENCE AUTHENTIC JAPANESE DENIM</h3>
            <p className="text-xs text-gray-400">Own one of our 4 flagship editions, pre-ordered in limited shuttle batches.</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-white text-gray-950 text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl hover:bg-gray-200 transition shadow-xl"
            >
              Shop Flagship Jeans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
