'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Shield, Lock } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
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
      const user = await login(email, password);
      if (user.role !== 'admin' && user.role !== 'manager') {
        throw new Error('Access denied. Administrator privileges required.');
      }
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8 shadow-xl space-y-6">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center mx-auto mb-3 shadow">
          <Shield className="w-6 h-6" />
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">AUTHORIZED STAFF ONLY</span>
        <h1 className="text-2xl font-display font-extrabold uppercase text-gray-900">ADMIN CONSOLE</h1>
        <p className="text-xs text-gray-500">Sign in to manage catalog products, stocks, and incoming orders.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Staff Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter staff email address"
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
            placeholder="Enter staff password"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl hover:bg-black transition shadow-lg flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4" />
          {loading ? 'Authenticating...' : 'Enter Admin Studio'}
        </button>
      </form>

      <div className="text-center pt-2 text-xs text-gray-400">
        <Link href="/" className="hover:underline">&larr; Return to Storefront</Link>
      </div>
    </div>
  );
}
