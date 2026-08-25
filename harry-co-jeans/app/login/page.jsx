'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/AuthContext';
import { Lock, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/account');
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-32 pb-20 max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-md space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs uppercase font-bold tracking-widest text-gray-500">THE GUILD</span>
            <h1 className="text-2xl font-display font-extrabold uppercase text-gray-900">MEMBER SIGN IN</h1>
            <p className="text-xs text-gray-500">Access your order tracking, address book, and loyalty points.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-black transition shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Account'}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-gray-500 space-y-2 border-t border-gray-100">
            <p>Don't have an account? <Link href="/register" className="font-bold text-gray-900 underline">Create one</Link></p>
            <p><Link href="/admin/login" className="text-gray-400 hover:text-gray-900">Are you a store admin? Login to Admin Console &rarr;</Link></p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
