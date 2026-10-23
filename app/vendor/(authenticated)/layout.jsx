'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VendorSidebar from './VendorSidebar';
import VendorNavbar from './VendorNavbar';

export const dynamic = 'force-dynamic';

export default function AuthenticatedVendorLayout({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [vendorData, setVendorData] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`/api/vendor/auth/me?t=${Date.now()}`, {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          setVendorData(data.user);
          if (!sessionStorage.getItem('vendorSessionStart')) {
            sessionStorage.setItem('vendorSessionStart', Date.now().toString());
          }
          setIsAuthenticated(true);
        } else {
          sessionStorage.clear();
          router.push('/vendor');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        sessionStorage.clear();
        router.push('/vendor');
        return;
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <h3 className="mt-4 text-base font-bold text-gray-800">StellarMart Vendor Portal</h3>
          <p className="mt-1 text-xs text-gray-500">Verifying secure merchant credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 280px Fixed Sidebar matching Admin panel */}
      <VendorSidebar vendor={vendorData} />
      
      {/* Main Content Area offset by 280px */}
      <div className="flex-1 ml-[280px] min-w-0 flex flex-col">
        <VendorNavbar vendorName={vendorData?.shop_name || vendorData?.username || 'Vendor Store'} />
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
