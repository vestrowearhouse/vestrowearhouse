'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import VendorSessionTimer from './VendorSessionTimer';

const pageTitles = {
  '/vendor/dashboard': 'Dashboard',
  '/vendor/products': 'My Products',
  '/vendor/orders': 'Orders',
  '/vendor/analytics': 'Analytics',
  '/vendor/revenue': 'Revenue',
  '/vendor/coupons': 'Coupons & Offers',
  '/vendor/messages': 'Messages',
  '/vendor/reviews': 'Customer Reviews',
  '/vendor/settings': 'Settings',
  '/vendor/profile': 'Store Profile',
  '/vendor/shipping': 'Shipping Settings',
  '/vendor/notifications': 'Notifications',
};

export default function VendorNavbar({ vendor }) {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitles[pathname] || pageTitles[`/${pathname.split('/').slice(1, 3).join('/')}`] || 'Vendor Panel';

  const handleLogout = async () => {
    try {
      await fetch('/api/vendor/auth/logout', { method: 'POST', credentials: 'include' });
      sessionStorage.clear();
      router.push('/vendor');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>
        <div className="flex items-center gap-6">
          <VendorSessionTimer />
          <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-lg">
            <span className="text-sm text-gray-600">
              {vendor?.shop_name || vendor?.username || 'Vendor'}
            </span>
          </div>
          <Link href="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
            View Store
          </Link>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
