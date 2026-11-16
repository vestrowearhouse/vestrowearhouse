'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, Phone, AlertCircle, Loader, Eye, EyeOff, CheckCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Basic validation
      if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
        throw new Error('দয়া করে সব প্রয়োজনীয় তথ্য পূরণ করুন');
      }

      if (formData.password.length < 6) {
        throw new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('পাসওয়ার্ড দুটি মিলছে না');
      }

      const csrfToken = typeof document !== 'undefined'
        ? document.cookie.split('; ').find((row) => row.startsWith('csrf_token='))?.split('=')[1]
        : null;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone?.trim() || null,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে');
      }

      setSuccess(true);

      if (data.user) {
        login(data.user);
      }

      setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/';
        window.location.href = redirect;
      }, 1200);
    } catch (err) {
      console.error('[Register] Error:', err);
      setError(err.message || 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-180px)] py-12 px-4 flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-blue-50/20">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-2xl border border-green-200/80 shadow-xl shadow-green-100/50 p-7 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-3.5 shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে!</h2>
            <p className="text-xs text-neutral-500 mb-3 uppercase tracking-wider font-semibold">Welcome to Vestro Wear House</p>
            <div className="inline-flex items-center gap-2 text-xs text-blue-600 font-medium bg-blue-50/60 px-3 py-1.5 rounded-lg">
              <Loader className="w-3.5 h-3.5 animate-spin" />
              <span>হোমপেজে নিয়ে যাওয়া হচ্ছে...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-180px)] py-8 sm:py-12 px-4 flex items-center justify-center bg-gradient-to-b from-slate-50/80 via-white to-blue-50/20">
      <div className="w-full max-w-[420px]">
        {/* Compact Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-100/90 p-6 sm:p-7 transition-all">
          
          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 mb-3">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">নতুন অ্যাকাউন্ট</h1>
            <p className="text-xs text-slate-500 mt-0.5">স্টেলারমার্টে কেনাকাটা করতে রেজিস্টার করুন</p>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex p-1 bg-slate-100/80 rounded-xl mb-5 text-xs font-semibold">
            <Link
              href="/login"
              className="flex-1 py-1.5 text-center rounded-lg text-slate-600 hover:text-slate-900 transition"
            >
              সাইন ইন (Sign In)
            </Link>
            <button
              type="button"
              className="flex-1 py-1.5 rounded-lg bg-white text-blue-600 shadow-sm transition"
            >
              রেজিস্ট্রেশন (Register)
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-2 text-xs text-red-700 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="font-medium flex-1">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                আপনার নাম
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="আপনার পুরো নাম"
                  disabled={loading}
                  required
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition disabled:bg-slate-100 text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ইমেইল ঠিকানা
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  disabled={loading}
                  required
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition disabled:bg-slate-100 text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                ফোন নম্বর <span className="text-[10px] text-slate-400 lowercase font-normal">(ঐচ্ছিক)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                  disabled={loading}
                  className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition disabled:bg-slate-100 text-slate-800 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Fields (Side by side on sm) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    disabled={loading}
                    required
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition disabled:bg-slate-100 text-slate-800 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  নিশ্চিত করুন
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="পাসওয়ার্ড পুনরায়"
                    disabled={loading}
                    required
                    className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition disabled:bg-slate-100 text-slate-800 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-sm disabled:opacity-60 mt-3"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                </>
              ) : (
                <span>অ্যাকাউন্ট তৈরি করুন</span>
              )}
            </button>
          </form>

          {/* Terms Note */}
          <p className="text-[11px] text-slate-500 text-center mt-3.5">
            রেজিস্ট্রেশন করে আপনি আমাদের{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">
              শর্তাবলী
            </Link>{' '}
            ও{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              গোপনীয়তা নীতি
            </Link>{' '}
            মেনে নিচ্ছেন।
          </p>

          {/* Footer note */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span>১০০% নিরাপদ ও সুরক্ষিত ডেটা সুরক্ষা</span>
          </div>
        </div>
      </div>
    </div>
  );
}