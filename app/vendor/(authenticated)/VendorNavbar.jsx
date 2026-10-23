'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LogOut, Bell, Store, Shield, ExternalLink } from 'lucide-react';
import VendorSessionTimer from '../VendorSessionTimer';

const pageTitles = {
  '/vendor': 'Dashboard',
  '/vendor/dashboard': 'Vendor Dashboard',
  '/vendor/analytics': 'Analytics & Performance',
  '/vendor/products': 'My Products & Inventory',
  '/vendor/products/add': 'Add New Product',
  '/vendor/products/requests': 'Product Approval Requests',
  '/vendor/orders': 'Orders Management',
  '/vendor/revenue': 'Revenue & Payouts',
  '/vendor/coupons': 'Discount Coupons & Offers',
  '/vendor/shipping': 'Shipping Rates & Fulfillment',
  '/vendor/reviews': 'Customer Ratings & Reviews',
  '/vendor/questions': 'Customer Q&A Management',
  '/vendor/chat': 'Live Customer Support Chat',
  '/vendor/messages': 'Direct Customer Inquiries',
  '/vendor/profile': 'Merchant Store Profile',
  '/vendor/settings': 'Store Preferences & Settings',
  '/vendor/notifications': 'Notifications & Alerts',
  '/vendor/support': 'Merchant Help & Support Desk',
};

export default function VendorNavbar({ vendorName = 'Vendor Store' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);

  // Derive title smoothly
  const title =
    pageTitles[pathname] ||
    pageTitles[`/${pathname.split('/').slice(1, 3).join('/')}`] ||
    'Vendor Portal';

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`/api/vendor/notifications?t=${Date.now()}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          setNotificationCount(data.unread_count || data.notifications?.filter(n => !n.read)?.length || 0);
        }
      } catch (e) {
        // silent
      }
    };
    fetchNotifications();
    // Only poll when tab is active (saves massive background requests when tab is inactive)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchNotifications();
    }, 60000);

    const onFocus = () => fetchNotifications();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out?')) return;
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
        {/* Left: Dynamic Page Title */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">{title}</h2>
          <span className="hidden sm:inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-100">
            {vendorName}
          </span>
        </div>

        {/* Right: Actions, Timer, Profile & Logout */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Real-time Session Expiry Timer */}
          <div className="hidden md:flex items-center gap-2">
            <VendorSessionTimer />
          </div>

          {/* Notifications Link */}
          <Link
            href="/vendor/notifications"
            className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Link>

          {/* Quick View Website */}
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-xs font-bold transition-all"
          >
            <Store className="w-3.5 h-3.5" />
            <span>View Website</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </Link>

          {/* Red Logout Button matching Admin */}
          <button 
            onClick={handleLogout}
            className="px-3.5 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center gap-1.5 text-xs font-bold transition-all border border-red-100 shadow-2xs hover:scale-105 active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
