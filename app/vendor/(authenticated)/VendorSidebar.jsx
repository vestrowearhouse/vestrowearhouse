'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  LogOut, 
  ShieldCheck, 
  Store, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

const menuSections = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', href: '/vendor/dashboard', icon: '📊' },
      { name: 'Analytics & Insights', href: '/vendor/analytics', icon: '📈' },
    ],
  },
  {
    title: 'Catalog & Inventory',
    items: [
      { name: 'My Products', href: '/vendor/products', icon: '🛍️' },
      { name: 'Add New Product', href: '/vendor/products/add', icon: '➕' },
      { name: 'Bulk Import (CSV/Excel)', href: '/vendor/products/bulk', icon: '📥' },
    ],
  },
  {
    title: 'Sales & Orders',
    items: [
      { name: 'All Orders', href: '/vendor/orders', icon: '📦' },
      { name: 'Marketplace Campaigns', href: '/vendor/campaigns', icon: '⚡' },
      { name: 'Revenue & Payouts', href: '/vendor/revenue', icon: '💰' },
      { name: 'Discount Coupons', href: '/vendor/coupons', icon: '🎟️' },
      { name: 'Shipping Rates', href: '/vendor/shipping', icon: '🚚' },
    ],
  },
  {
    title: 'Customer Relations',
    items: [
      { name: 'Customer Reviews', href: '/vendor/reviews', icon: '⭐' },
      { name: 'Buyer Inquiries', href: '/vendor/messages', icon: '✉️' },
      { name: 'Live Admin Chat', href: '/vendor/chat', icon: '💬' },
    ],
  },
  {
    title: 'Store Management',
    items: [
      { name: 'Store Profile', href: '/vendor/profile', icon: '🏪' },
      { name: 'Store Settings', href: '/vendor/settings', icon: '⚙️' },
      { name: 'Store Notifications', href: '/vendor/notifications', icon: '🔔' },
      { name: 'Merchant Help Desk', href: '/vendor/support', icon: '💡' },
    ],
  },
];

function MenuSection({ section, activeHref }) {
  const [isOpen, setIsOpen] = useState(true);
  const isActive = section.items.some(
    (item) => !item.external && (item.href === activeHref || activeHref?.startsWith(item.href + '/'))
  );

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
          isActive 
            ? 'text-blue-700 bg-blue-50/60 border border-blue-100/80' 
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
        }`}
      >
        <span>{section.title}</span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="space-y-1.5 mt-1.5 pl-1">
          {section.items.map((item) => {
            const isItemActive = !item.external && (
              item.href === activeHref || 
              (item.href !== '/vendor/dashboard' && activeHref?.startsWith(item.href))
            );

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
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function VendorSidebar({ vendor }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const currentPath = pathname ? pathname.replace(/\/+$/, '') || '/' : '';

  const allItems = menuSections.flatMap((section) => section.items).filter(i => !i.external);
  const activeItem = allItems
    .filter((item) => {
      const itemPath = item.href.replace(/\/+$/, '') || '/';
      return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
    })
    .sort((a, b) => b.href.length - a.href.length)[0];

  const activeHref = activeItem ? activeItem.href : currentPath;

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out of your vendor portal?')) return;
    setLoggingOut(true);
    try {
      await fetch('/api/vendor/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      sessionStorage.clear();
      router.push('/vendor');
      router.refresh();
    }
  };

  const storeName = vendor?.shop_name || vendor?.name || 'My Store';

  return (
    <aside className="w-[280px] bg-white shadow-xl fixed h-full overflow-y-auto z-40 border-r border-gray-100 flex flex-col">
      {/* Brand & Store Header */}
      <div className="sticky top-0 p-5 border-b border-gray-100 bg-white/95 backdrop-blur-sm z-10">
        <Link href="/vendor/dashboard" className="text-2xl font-extrabold text-blue-700 flex items-center gap-2 tracking-tight">
          🛒 StellarMartBD
        </Link>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor Dashboard</p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live
          </span>
        </div>

        {/* Store Profile Quick Card */}
        <div className="mt-3.5 p-2.5 bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-100/70 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-xs overflow-hidden shrink-0">
            {vendor?.logo_url ? (
              <img src={vendor.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span>{storeName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h4 className="text-xs font-bold text-gray-900 truncate">{storeName}</h4>
              {(vendor?.verification_badge || vendor?.is_verified) && (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" title="Verified Merchant" />
              )}
            </div>
            <p className="text-[11px] text-gray-500 truncate">{vendor?.email || 'vendor@stellarmartbd.com'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="p-4 pb-28 flex-1">
        {menuSections.map((section) => (
          <MenuSection 
            key={section.title} 
            section={section} 
            activeHref={activeHref} 
          />
        ))}
      </nav>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-0 w-full p-4 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-600 rounded-lg font-semibold text-xs transition-colors border border-gray-200 hover:border-blue-200"
        >
          <span>🌐</span>
          <span>View Main Website</span>
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </Link>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold text-xs transition-colors border border-red-100 disabled:opacity-50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{loggingOut ? 'Signing out...' : 'Sign Out of Vendor Portal'}</span>
        </button>
      </div>
    </aside>
  );
}
