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
    <nav className="bg-white/95 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-neutral-900">{title}</h2>
        </div>
        <div className="flex items-center gap-4">
          <SessionTimer />
          <Link 
            href="/" 
            className="px-3.5 py-1.5 bg-neutral-100 hover:bg-black hover:text-white text-neutral-800 text-xs font-bold uppercase tracking-wider rounded-md transition-all"
          >
            Storefront ↗
          </Link>
          <button 
            onClick={handleLogout}
            className="px-3.5 py-1.5 border border-neutral-200 text-neutral-700 hover:bg-black hover:text-white hover:border-black text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
