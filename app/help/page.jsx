'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Ruler, Droplet, Wind, Send } from 'lucide-react';

export default function HelpPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <Header />
      <main className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-8 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs uppercase font-bold tracking-widest text-gray-500">ATELIER SUPPORT</span>
          <h1 className="text-3xl font-display font-extrabold uppercase text-gray-900">DENIM CARE &amp; SIZING</h1>
          <p className="text-xs text-gray-500">Everything you need to know about breaking in raw Japanese selvedge denim.</p>
        </div>

        {/* Sizing Table */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold uppercase text-gray-900 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-gray-900" /> SIZING MEASUREMENT MATRIX
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 font-bold uppercase text-gray-900">
                <tr>
                  <th className="p-3">Waist Tag</th>
                  <th className="p-3">True Waist (in)</th>
                  <th className="p-3">Front Rise (in)</th>
                  <th className="p-3">Thigh (in)</th>
                  <th className="p-3">Inseam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="p-3 font-bold">28</td><td className="p-3">29.0"</td><td className="p-3">10.5"</td><td className="p-3">11.2"</td><td className="p-3">32.0"</td></tr>
                <tr><td className="p-3 font-bold">30</td><td className="p-3">31.0"</td><td className="p-3">10.8"</td><td className="p-3">11.6"</td><td className="p-3">32.0"</td></tr>
                <tr><td className="p-3 font-bold">32</td><td className="p-3">33.0"</td><td className="p-3">11.0"</td><td className="p-3">12.0"</td><td className="p-3">32.0"</td></tr>
                <tr><td className="p-3 font-bold">34</td><td className="p-3">35.0"</td><td className="p-3">11.5"</td><td className="p-3">12.5"</td><td className="p-3">32.0"</td></tr>
                <tr><td className="p-3 font-bold">36</td><td className="p-3">37.0"</td><td className="p-3">11.8"</td><td className="p-3">13.0"</td><td className="p-3">32.0"</td></tr>
                <tr><td className="p-3 font-bold">38</td><td className="p-3">39.0"</td><td className="p-3">12.2"</td><td className="p-3">13.5"</td><td className="p-3">32.0"</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3 Care Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-2 shadow-sm">
            <h3 className="font-bold text-xs uppercase text-gray-900">01. Six Months Wear</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Wear raw denim daily without washing to establish natural whiskering creases.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-2 shadow-sm">
            <h3 className="font-bold text-xs uppercase text-gray-900">02. Cold Tub Soak</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Turn inside out, submerge in cold water with mild castile detergent for 30 minutes.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-2 shadow-sm">
            <h3 className="font-bold text-xs uppercase text-gray-900">03. Hang Dry Only</h3>
            <p className="text-xs text-gray-500 leading-relaxed">Hang dry upside down in shaded breeze. Never use high heat tumble dryers.</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold uppercase text-gray-900">MESSAGE THE ATELIER TEAM</h2>
          {submitted ? (
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-4 rounded-xl">
              Thank you! Your message has been sent to our denim tailoring team.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="email" required placeholder="Your Email" className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-bold focus:outline-none focus:border-gray-900" />
                <input type="text" placeholder="Subject" className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-bold focus:outline-none focus:border-gray-900" />
              </div>
              <textarea required rows={3} placeholder="How can we assist your denim journey?" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-bold focus:outline-none focus:border-gray-900" />
              <button type="submit" className="bg-gray-900 text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl hover:bg-black transition">
                Send Message
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
