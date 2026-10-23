'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, LogOut } from 'lucide-react';

export default function SessionExpiredModal() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [countDown, setCountDown] = useState(5);

  useEffect(() => {
    // Check session expiry every 60 seconds (prevents aggressive 1-second server hammering)
    const checkSession = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/admin-me', {
          credentials: 'include'
        });
        
        if (!res.ok) {
          setIsVisible(true);
          clearInterval(checkSession);
        }
      } catch (error) {
        // Ignore - session check failed
      }
    }, 60000);

    return () => clearInterval(checkSession);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCountDown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          sessionStorage.clear();
          router.push('/admin-login?expired=true');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, router]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm overflow-hidden">
        <div className="bg-red-50 border-b-2 border-red-200 p-6">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-700 text-center">
            Session Expired
          </h2>
          <p className="text-red-600 text-center mt-2 text-sm">
            Your admin session has expired for security reasons
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">ℹ️ Security Notice:</span>
              <br />
              Your session expires after 10 minutes for your account protection. Please log in again to continue.
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">Redirecting in:</p>
            <div className="inline-block bg-blue-100 text-blue-700 font-bold text-2xl px-6 py-3 rounded-lg">
              {countDown}s
            </div>
          </div>

          <button
            onClick={() => {
              sessionStorage.clear();
              router.push('/admin-login?expired=true');
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Go to Login Now
          </button>
        </div>
      </div>
    </div>
  );
}
