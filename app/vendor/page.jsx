'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, Mail, Store } from 'lucide-react';
import Link from 'next/link';

export default function VendorLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    sessionStorage.clear();

    const params = new URLSearchParams(window.location.search);
    if (params.get('expired')) {
      setSessionExpired(true);
    }
  }, []);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrf_token='))
        ?.split('=')[1];

      const res = await fetch('/api/vendor/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Response JSON parse error:', parseErr);
      }

      if (res.ok) {
        sessionStorage.setItem('vendorSessionStart', Date.now().toString());
        router.push('/vendor/dashboard');
        router.refresh();
      } else {
        setError(data?.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Connection failed. Please check your internet and try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#b45309] to-[#92400e] p-8 text-center">
          <div className="flex justify-center mb-3">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Vendor Portal</h1>
          <p className="text-amber-100 mt-1">StellarMartBD</p>
          <p className="text-xs text-amber-200 mt-3">Manage Your Store & Sales</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {sessionExpired && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex gap-2">
              <Store className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Session Expired</p>
                <p className="text-xs mt-1">Your vendor session has expired. Please log in again.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-semibold mb-1">Login Failed</p>
              <p className="text-xs">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="vendor@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#b45309] to-[#92400e] text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Login to Vendor Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="bg-gray-50 px-8 py-4 border-t text-center text-xs text-gray-600">
          <p>
            Don't have a vendor account?{' '}
            <Link href="/" className="text-amber-600 hover:text-amber-700 font-medium">
              Contact Admin
            </Link>
          </p>
          <p className="mt-2 text-gray-500">
            <Link href="/" className="text-amber-600 hover:text-amber-700 font-medium">
              Back to Website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
