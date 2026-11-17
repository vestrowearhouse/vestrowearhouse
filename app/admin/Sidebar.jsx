'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

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
    <div className="mb-2.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] rounded-lg transition-colors ${
          isActive 
            ? 'text-black bg-neutral-100 font-extrabold border border-neutral-200' 
            : 'text-neutral-400 hover:text-black hover:bg-neutral-50 border border-transparent'
        }`}
      >
        <span>{section.title}</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      
      {isOpen && (
        <div className="space-y-1 mt-1 pl-0.5">
          {section.items.map((item) => {
            const isItemActive = !item.external && item.href === activeHref;
            return item.external ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:text-black hover:bg-neutral-100 border border-transparent transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.name}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isItemActive 
                    ? 'bg-black text-white font-bold shadow-xs' 
                    : 'text-neutral-700 hover:text-black hover:bg-neutral-100 border border-transparent'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="truncate">{item.name}</span>
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
    <aside className="w-[280px] bg-white fixed h-full overflow-y-auto z-40 border-r border-neutral-200 flex flex-col shadow-xs">
      {/* Brand Header */}
      <div className="sticky top-0 p-5 border-b border-neutral-200 bg-white/95 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between">
          <BrandLogo size="sm" />
          <span className="px-2 py-0.5 bg-black text-white text-[9px] font-bold tracking-[0.16em] uppercase rounded-sm">
            ADMIN
          </span>
        </div>
      </div>
      
      {/* Navigation List */}
      <nav className="p-3 pb-24 flex-1">
        {menuSections.map((section) => (
          <MenuSection 
            key={section.title} 
            section={section} 
            activeHref={activeHref} 
          />
        ))}
      </nav>
      
      {/* Bottom Sticky Action */}
      <div className="sticky bottom-0 w-full p-4 border-t border-neutral-200 bg-white z-10">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-black hover:bg-neutral-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
        >
          <span>View Storefront →</span>
        </Link>
      </div>
    </aside>
  );
}
