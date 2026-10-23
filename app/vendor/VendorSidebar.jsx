'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  LogOut, 
  Store, 
  BarChart3,
  TrendingUp,
  User,
  Truck,
  Bell,
  MessageSquare,
  Star,
  Gift,
  HelpCircle
} from 'lucide-react';

export default function VendorSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/vendor/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    sessionStorage.clear();
    router.push('/vendor');
    router.refresh();
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/vendor/dashboard' },
    { name: 'Products', icon: Package, href: '/vendor/products' },
    { name: 'Orders', icon: ShoppingCart, href: '/vendor/orders' },
    { name: 'Analytics', icon: BarChart3, href: '/vendor/analytics' },
    { name: 'Revenue', icon: TrendingUp, href: '/vendor/revenue' },
    { name: 'Customer Q&A', icon: HelpCircle, href: '/vendor/questions' },
    { name: 'Reviews', icon: Star, href: '/vendor/reviews' },
    { name: 'Coupons', icon: Gift, href: '/vendor/coupons' },
    { name: 'Messages', icon: MessageSquare, href: '/vendor/messages' },
    { name: 'Help & Support', icon: HelpCircle, href: '/vendor/support' },
    { name: 'Notifications', icon: Bell, href: '/vendor/notifications' },
  ];

  const currentPath = pathname ? pathname.replace(/\/+$/, '') || '/' : '';
  const activeItem = menuItems
    .filter((item) => {
      const itemPath = item.href.replace(/\/+$/, '') || '/';
      return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
    })
    .sort((a, b) => b.href.length - a.href.length)[0];
  const activeHref = activeItem?.href;

  return (
    <aside className="w-64 bg-white shadow-lg fixed h-full overflow-y-auto z-40 border-r border-gray-100 flex flex-col">
      <div className="sticky top-0 p-6 border-b bg-white flex items-center gap-3">
        <div className="bg-amber-600 p-2 rounded-xl shadow-sm">
          <Store className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Vendor Portal</h2>
          <p className="text-xs text-gray-500">StellarMartBD</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = item.href === activeHref;
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isActive ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100/50' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t bg-white shadow-sm mt-auto">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
