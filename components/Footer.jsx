'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white pt-16 pb-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Col 1 */}
        <div className="space-y-4">
          <Link href="/" className="text-xl font-display font-black tracking-tighter uppercase text-white">
            HARRY &amp; CO
          </Link>
          <p className="text-xs text-gray-400 leading-relaxed">
            Makers of genuine Japanese and Italian selvedge denim. Woven slowly on vintage Toyoda shuttle looms with natural indigo dye.
          </p>
          <p className="text-[11px] text-gray-500">&copy; {new Date().getFullYear()} HARRY &amp; CO JEANS ATELIER.</p>
        </div>

        {/* Col 2 */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-200">DENIM CUTS</h4>
          <ul className="space-y-2 text-xs text-gray-400">
            <li><Link href="/shop?fit=straight" className="hover:text-white transition">Vintage Straight (14oz)</Link></li>
            <li><Link href="/shop?fit=slim" className="hover:text-white transition">Chelsea Slim Tapered (13.5oz)</Link></li>
            <li><Link href="/shop?fit=baggy" className="hover:text-white transition">Shibuya Wide-Leg (15oz)</Link></li>
            <li><Link href="/shop?productType=Jackets" className="hover:text-white transition">Artisan Trucker Jacket</Link></li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-200">ATELIER &amp; CARE</h4>
          <ul className="space-y-2 text-xs text-gray-400">
            <li><Link href="/selvedge" className="hover:text-white transition">Shuttle Loom Weaving</Link></li>
            <li><Link href="/help" className="hover:text-white transition">Raw Denim Sizing Guide</Link></li>
            <li><Link href="/help" className="hover:text-white transition">6-Month Wash Rules</Link></li>
            <li><Link href="/admin/login" className="hover:text-white transition">Staff Admin Portal</Link></li>
          </ul>
        </div>

        {/* Col 4 */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-200">THE SELVEDGE GUILD</h4>
          <p className="text-xs text-gray-400">Subscribe for early access to limited loom runs.</p>
          <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed to Atelier Dispatch!'); }} className="space-y-2">
            <input 
              type="email" 
              placeholder="Enter your email" 
              required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white"
            />
            <button 
              type="submit" 
              className="w-full bg-white text-gray-950 text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg hover:bg-gray-200 transition"
            >
              Join Guild
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
}
