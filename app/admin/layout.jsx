"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import AdminNavbar from './AdminNavbar';
import SessionExpiredModal from './SessionExpiredModal';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/admin-me', {
          credentials: 'include'
        });
        
        if (res.ok) {
          // Initialize session start time for the hard timeout
          if (!sessionStorage.getItem('sessionStart')) {
            sessionStorage.setItem('sessionStart', Date.now());
          }
          setIsAuthenticated(true);
        } else {
          sessionStorage.clear();
          router.push('/admin-login');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        sessionStorage.clear();
        router.push('/admin-login');
        return;
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Handle ACTUAL browser close/tab close — NOT client-side navigation
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleBeforeUnload = (e) => {
      // Only trigger if the page is actually closing/refreshing, not on
      // client-side router.push() navigations which do NOT fire beforeunload.
      // We clear sessionStorage so a hard refresh forces re-auth.
      sessionStorage.removeItem('sessionStart');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#083b66] mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, this component won't render (redirect happens in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <SessionExpiredModal />
      <Sidebar />
      <div className="flex-1 ml-[280px]">
        <AdminNavbar />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

