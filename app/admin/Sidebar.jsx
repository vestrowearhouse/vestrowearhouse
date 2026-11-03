'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const menuSections = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
      { name: 'Live Support', href: '/admin/support', icon: '💬' },
    ]
  },
  {
    title: 'Catalog Management',
    items: [
      { name: 'Products', href: '/admin/products', icon: '🛍️' },
      { name: 'Bulk Add Products', href: '/admin/products/bulk', icon: '📥' },
      { name: 'SKU Codes & Master', href: '/admin/sku-management', icon: '🏷️' },
      { name: 'Categories', href: '/admin/categories', icon: '📁' },
      { name: 'Bulk Add Categories', href: '/admin/categories/bulk', icon: '📑' },
      { name: 'Banners', href: '/admin/banners', icon: '🖼️' },
      { name: 'Flash Sale', href: '/admin/flash-sale', icon: '⚡' },
      { name: 'Home Quick Icons', href: '/admin/quick-channels', icon: '📱' },
      { name: 'Media Library', href: '/admin/media', icon: '🖼️' },
    ]
  },
  {
    title: 'Sales & Orders',
    items: [
      { name: 'Orders', href: '/admin/orders', icon: '📦' },
      { name: 'Coupons', href: '/admin/coupons', icon: '🎟️' },
      { name: 'Shipping', href: '/admin/shipping', icon: '🚚' },
      { name: 'Revenue', href: '/admin/revenue', icon: '💵' },
    ]
  },
  {
    title: 'Vendors',
    items: [
      { name: 'All Vendors', href: '/admin/vendors', icon: '🏪' },
      { name: 'Vendor Product Requests', href: '/admin/vendor-product-requests', icon: '🧾' },
      { name: 'Vendor Orders', href: '/admin/vendor-orders', icon: '📦' },
      { name: 'Vendor Products', href: '/admin/vendor-products', icon: '🛍️' },
      { name: 'Vendor Analytics', href: '/admin/vendor-analytics', icon: '📊' },
      { name: 'Vendor Revenue', href: '/admin/vendor-revenue', icon: '💰' },
      { name: 'Vendor Settings', href: '/admin/vendor-settings', icon: '⚙️' },
    ]
  },
  {
    title: 'Community',
    items: [
      { name: 'Users', href: '/admin/users', icon: '👥' },
      { name: 'Reviews & Q&A', href: '/admin/reviews', icon: '⭐' },
      { name: 'Contact Messages', href: '/admin/contact', icon: '✉️' },
      { name: 'Open Webmail', href: 'https://mail.zoho.com', icon: '📧', external: true },
      { name: 'Webmail (Inbox & Send)', href: '/admin/webmail', icon: '📬' },
    ]
  },
  {
    title: 'Content',
    items: [
      { name: 'Pages', href: '/admin/pages', icon: '📄' },
      { name: 'Notifications', href: '/admin/notifications', icon: '🔔' },
    ]
  },
  {
    title: 'Analytics & Insights',
    items: [
      { name: 'Analytics', href: '/admin/analytics', icon: '📊' },
      { name: 'Vercel Analytics', href: 'https://vercel.com/stellermartbd-2168s-projects/stellarmartbd/analytics', icon: '📈', external: true },
      { name: 'Speed Insights', href: 'https://vercel.com/stellermartbd-2168s-projects/stellarmartbd/speed-insights', icon: '⚡', external: true },
      { name: 'Reports', href: '/admin/reports', icon: '📋' },
      { name: 'User Intelligence', href: '/admin/user-intelligence', icon: '🧠' },
      { name: 'Marketing Intel', href: '/admin/marketing-intel', icon: '📈' },
    ]
  },
  {
    title: 'System',
    items: [
      { name: 'System Health', href: '/admin/system-health', icon: '💚' },
      { name: 'Database', href: '/admin/database', icon: '🗄️' },
      { name: 'Cache', href: '/admin/cache', icon: '💾' },
      { name: 'Backup & Restore', href: '/admin/backup', icon: '💰' },
      { name: 'Build Logs', href: '/admin/build-logs', icon: '🔧' },
      { name: 'Page Logs', href: '/admin/page-logs', icon: '📝' },
      { name: 'Activity Logs', href: '/admin/activity-logs', icon: '📜' },
    ]
  },
  {
    title: 'Settings',
    items: [
      { name: 'Site Settings', href: '/admin/settings', icon: '⚙️' },
      { name: 'SEO', href: '/admin/seo', icon: '🔍' },
    ]
  },
];

function MenuSection({ section, activeHref }) {
  const [isOpen, setIsOpen] = useState(true);
  
  // Check if active item belongs to this section
  const isActive = section.items.some(item => !item.external && item.href === activeHref);
  
  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
          isActive ? 'text-blue-700 bg-blue-50/60 border border-blue-100/80' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
        }`}
      >
        <span>{section.title}</span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      
      {isOpen && (
        <div className="space-y-1.5 mt-1.5 pl-1">
          {section.items.map((item) => {
            const isItemActive = !item.external && item.href === activeHref;
            return item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-gray-700 font-medium border border-gray-200/70 bg-gray-50/40 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                  isItemActive 
                    ? 'bg-blue-600 text-white font-semibold border border-blue-600 shadow-md shadow-blue-500/20' 
                    : 'text-gray-700 border border-gray-200/70 bg-gray-50/40 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const currentPath = pathname ? pathname.replace(/\/+$/, '') || '/' : '';

  // Find the single best matching internal menu item across all sections:
  // Sort by length descending so that more specific paths (e.g. '/admin/products/bulk')
  // take precedence over parent paths (e.g. '/admin/products')
  const allInternalItems = menuSections
    .flatMap((section) => section.items)
    .filter((item) => !item.external);

  const activeItem = allInternalItems
    .filter((item) => {
      const itemPath = item.href.replace(/\/+$/, '') || '/';
      return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
    })
    .sort((a, b) => b.href.length - a.href.length)[0];

  const activeHref = activeItem ? activeItem.href : null;

  return (
    <aside className="w-[280px] bg-white shadow-xl fixed h-full overflow-y-auto z-40 border-r border-gray-100 flex flex-col">
      <div className="sticky top-0 p-6 border-b border-gray-100 bg-white/95 backdrop-blur-sm z-10">
        <Link href="/admin/dashboard" className="text-2xl font-extrabold text-blue-700 flex items-center gap-2 tracking-tight">
          🛒 StellarMartBD
        </Link>
        <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">Admin Dashboard</p>
      </div>
      
      <nav className="p-4 pb-24 flex-1">
        {menuSections.map((section) => (
          <MenuSection 
            key={section.title} 
            section={section} 
            activeHref={activeHref} 
          />
        ))}
      </nav>
      
      <div className="sticky bottom-0 w-full p-4 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gray-50 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 font-semibold text-sm transition-colors border border-gray-200 hover:border-blue-200"
        >
          <span>🌐</span>
          <span>View Website</span>
        </Link>
      </div>
    </aside>
  );
}
