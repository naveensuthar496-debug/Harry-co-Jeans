'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { LayoutDashboard, Package, Layers, ShoppingCart, Users, BarChart3, Settings, LogOut, Store } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Layers },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <aside className="w-64 bg-gray-950 text-white flex flex-col justify-between p-6 shrink-0 border-r border-gray-800">
      <div className="space-y-8">
        {/* Brand */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">ADMIN CONSOLE</span>
          <h2 className="text-lg font-black tracking-tighter uppercase text-white mt-0.5">HARRY &amp; CO</h2>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  isActive
                    ? 'bg-white text-gray-950 shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="space-y-3 pt-6 border-t border-gray-800">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-400 hover:text-white transition"
        >
          <Store className="w-4 h-4" />
          <span>Open Storefront</span>
        </Link>

        <div className="flex items-center justify-between px-3 py-2 bg-gray-900 rounded-xl">
          <div className="text-left">
            <p className="text-xs font-bold text-white truncate">{user?.fullName || 'Admin'}</p>
            <p className="text-[10px] text-gray-400">Staff Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 p-1.5 rounded transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
