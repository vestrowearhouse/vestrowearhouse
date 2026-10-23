'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader, AlertCircle, X, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isLoginModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLoginModalOpen) {
        closeLoginModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginModalOpen, closeLoginModal]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isLoginModalOpen) {
      document.body.style.overflow = 'hidden';
      setError(null);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLoginModalOpen]);

  // Process Google User with backend
  const processGoogleUser = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken();

    const res = await fetch('/api/auth/google-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        idToken,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google login failed');
    }

    if (data.user) {
      login(data.user);
      closeLoginModal();
    } else {
      throw new Error('No user data received from Google login');
    }
  };

  // Google popup click
  const handleGoogleClick = async () => {
    setError(null);
    setLoading(true);

    try {
      const { auth, googleProvider, isFirebaseConfigured } = await import('@/lib/firebase');
      const { signInWithPopup } = await import('firebase/auth');

      if (!isFirebaseConfigured || !auth) {
        throw new Error('গুগল লগইন বর্তমানে পাওয়া যাচ্ছে না। ইমেইল বা ফোন নম্বর দিয়ে লগইন করুন।');
      }

      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        await processGoogleUser(result.user);
      }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setLoading(false);
        return;
      }
      console.error('[GoogleLoginModal] Error:', err);
      setError(err.message?.includes('popup')
        ? 'পপআপ উইন্ডো বন্ধ হয়ে গেছে। ব্রাউজারের পপআপ ব্লক চেক করুন।'
        : 'গুগল লগইনে সমস্যা হয়েছে। ইমেইল ও পাসওয়ার্ড দিয়ে চেষ্টা করুন।'
      );
    } finally {
      setLoading(false);
    }
  };

  // Normal Email / Phone + Password Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!identifier.trim() || !password) {
        throw new Error('ইমেইল/ফোন নম্বর এবং পাসওয়ার্ড দিন');
      }

      const csrfToken = typeof document !== 'undefined'
        ? document.cookie.split('; ').find((row) => row.startsWith('csrf_token='))?.split('=')[1]
        : null;

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ email: identifier.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'লগইন ব্যর্থ হয়েছে');
      }

      if (data.user) {
        login(data.user);
        closeLoginModal();
      } else {
        throw new Error('ব্যবহারকারীর তথ্য পাওয়া যায়নি');
      }
    } catch (err) {
      console.error('[LoginModal] Error:', err);
      setError(err.message || 'লগইন করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoginModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={closeLoginModal}
    >
      {/* Modal Container */}
      <div
        className="relative w-full max-w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 pt-5 pb-4 px-6 text-white text-center relative">
          <button
            onClick={closeLoginModal}
            className="absolute right-3.5 top-3.5 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/15 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-xs border border-white/20 shadow-inner">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">সাইন ইন / Login</h2>
          <p className="text-blue-100 text-xs mt-0.5">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-2 text-xs text-red-700 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="font-medium flex-1">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ইমেইল বা ফোন নম্বর
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="your@email.com বা 017xxxxxxxx"
                  disabled={loading}
                  required
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition text-slate-800 disabled:bg-slate-100 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  required
                  className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition text-slate-800 disabled:bg-slate-100 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-right pt-0.5">
              <Link
                href="/forgot-password"
                onClick={closeLoginModal}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-sm disabled:opacity-60 mt-1"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>লগইন হচ্ছে...</span>
                </>
              ) : (
                <span>সাইন ইন করুন</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-3.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2.5 bg-white text-slate-400 uppercase tracking-wider font-medium">অথবা</span>
            </div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading}
            className="w-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium py-2 px-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-60"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Google দিয়ে সাইন ইন</span>
          </button>

          {/* Footer Register Link */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>অ্যাকাউন্ট নেই?</span>
            <Link
              href="/register"
              onClick={closeLoginModal}
              className="text-blue-600 hover:underline font-semibold"
            >
              রেজিস্ট্রেশন করুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
