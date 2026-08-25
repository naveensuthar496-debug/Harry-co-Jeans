'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartContext';
import { money } from '@/lib/format';
import { CreditCard, QrCode, Building, Banknote, ShieldCheck, Lock } from 'lucide-react';

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [shippingAddress, setShippingAddress] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('hc_shipping_address');
      if (saved) setShippingAddress(JSON.parse(saved));
      else router.push('/checkout/address');
    } catch {}
  }, []);

  const handlePlaceOrder = async () => {
    setProcessing(true);
    try {
      const payload = {
        shippingAddress,
        items,
        paymentMethod,
        paymentId: `sim_${paymentMethod}_${Date.now()}`,
        customerEmail: shippingAddress?.email || 'customer@hcjeans.com',
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      clearCart();
      router.push(`/order-confirmed?order=${encodeURIComponent(data.orderNumber)}`);
    } catch (err) {
      alert(err.message || 'Error processing order');
      setProcessing(false);
    }
  };

  const total = subtotal + Math.round(subtotal * 0.05);

  return (
    <>
      <Header />
      <main className="pt-28 pb-20 max-w-4xl mx-auto px-4 sm:px-8 space-y-8">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-gray-500">STEP 2 OF 2</span>
          <h1 className="text-3xl font-display font-extrabold text-gray-900 uppercase">SELECT PAYMENT METHOD</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {/* Payment Options */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-700" /> SECURE ATELIER PAYMENT GATEWAY
              </h2>

              <div className="space-y-3">
                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'upi' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} className="text-gray-900 focus:ring-0" />
                    <div>
                      <p className="font-bold text-xs text-gray-900">UPI Instant Pay / QR Code</p>
                      <p className="text-[11px] text-gray-500">Google Pay, PhonePe, Paytm, Cred</p>
                    </div>
                  </div>
                  <QrCode className="w-5 h-5 text-gray-700" />
                </label>

                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'card' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="text-gray-900 focus:ring-0" />
                    <div>
                      <p className="font-bold text-xs text-gray-900">Credit / Debit Card</p>
                      <p className="text-[11px] text-gray-500">Visa, Mastercard, RuPay, Amex</p>
                    </div>
                  </div>
                  <CreditCard className="w-5 h-5 text-gray-700" />
                </label>

                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'netbanking' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" checked={paymentMethod === 'netbanking'} onChange={() => setPaymentMethod('netbanking')} className="text-gray-900 focus:ring-0" />
                    <div>
                      <p className="font-bold text-xs text-gray-900">Net Banking</p>
                      <p className="text-[11px] text-gray-500">All major Indian banks supported</p>
                    </div>
                  </div>
                  <Building className="w-5 h-5 text-gray-700" />
                </label>

                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === 'cod' ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="text-gray-900 focus:ring-0" />
                    <div>
                      <p className="font-bold text-xs text-gray-900">Cash on Delivery (COD)</p>
                      <p className="text-[11px] text-gray-500">Pay cash upon delivery at your door</p>
                    </div>
                  </div>
                  <Banknote className="w-5 h-5 text-gray-700" />
                </label>
              </div>
            </div>

            {/* Address Review Box */}
            {shippingAddress && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs text-gray-600 space-y-1">
                <span className="font-bold uppercase text-gray-900 block">Delivering to:</span>
                <p className="font-semibold text-gray-900">{shippingAddress.fullName} ({shippingAddress.phone})</p>
                <p>{shippingAddress.line1}, {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.zip}</p>
              </div>
            )}
          </div>

          {/* Right Summary & Action */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3">
              TOTAL PAYABLE
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items ({items.length})</span>
                <span className="font-bold text-gray-900">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-emerald-700 font-bold">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span>{money(Math.round(subtotal * 0.05))}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-gray-900 pt-3 border-t border-gray-100">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={processing}
              className="w-full bg-gray-900 text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-black transition text-center shadow-lg disabled:opacity-50"
            >
              {processing ? 'Processing Payment...' : `Authorize & Pay ${money(total)}`}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
