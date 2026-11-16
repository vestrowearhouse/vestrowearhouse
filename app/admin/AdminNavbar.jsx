'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import SessionTimer from './SessionTimer';

const pageTitles = {
  '/admin': 'Dashboard',
  '/admin/dashboard': 'Dashboard',
  '/admin/support': 'Live Support',
  '/admin/products': 'Products Management',
  '/admin/products/bulk': 'Bulk Add Products',
  '/admin/categories': 'Categories Management',
  '/admin/categories/bulk': 'Bulk Add Categories',
  '/admin/banners': 'Banners Management',
  '/admin/flash-sale': 'Flash Sale Management',
  '/admin/quick-channels': 'Home Quick Icons',
  '/admin/users': 'Users Management',
  '/admin/orders': 'Orders Management',
  '/admin/webmail': 'Webmail (Inbox & Send)',
  '/admin/pages': 'Pages Management',
  '/admin/settings': 'Settings',
  '/admin/contact': 'Contact Messages',
  '/admin/user-intelligence': 'User Intelligence',
  '/admin/marketing-intel': 'Marketing Intelligence',
  '/admin/analytics': 'Analytics',
  '/admin/reports': 'Reports',
  '/admin/system-health': 'System Health',
  '/admin/build-logs': 'Build Logs',
  '/admin/page-logs': 'Page Logs',
  '/admin/activity-logs': 'Activity Logs',
  '/admin/notifications': 'Notifications',
  '/admin/coupons': 'Coupons Management',
  '/admin/shipping': 'Shipping Management',
  '/admin/seo': 'SEO Settings',
  '/admin/media': 'Media Library',
  '/admin/database': 'Database Management',
  '/admin/cache': 'Cache Management',
  '/admin/backup': 'Backup & Restore',
};

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitles[pathname] || pageTitles[`/${pathname.split('/').slice(1, 3).join('/')}`] || 'Admin Panel';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin-logout', { method: 'POST', credentials: 'include' });
      sessionStorage.clear();
      router.push('/admin-login');
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
          <SessionTimer />
          <Link href="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            View Website
          </Link>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
