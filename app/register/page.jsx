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

      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error('[Register] JSON parse error:', jsonErr);
        throw new Error('সার্ভার থেকে সঠিক তথ্য পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }

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
      }, 1000);
    } catch (err) {
      console.error('[Register] Error:', err);
      setError(err.message || 'রেজিস্ট্রেশন করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-180px)] py-12 px-4 flex items-center justify-center bg-white">
        <div className="w-full max-w-[420px]">
          <div className="bg-white border border-neutral-200 p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wider text-neutral-900 mb-1">WELCOME TO VESTRO</h2>
            <p className="text-xs text-neutral-500 mb-4 font-semibold uppercase tracking-wider">অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে</p>
            <div className="inline-flex items-center gap-2 text-xs text-neutral-800 font-semibold uppercase tracking-wider bg-neutral-100 px-4 py-2">
              <Loader className="w-3.5 h-3.5 animate-spin" />
              <span>রিডাইরেক্ট করা হচ্ছে...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-180px)] py-10 sm:py-16 px-4 flex items-center justify-center bg-white">
      <div className="w-full max-w-[440px]">
        {/* Onfire / Minimalist Luxury Container */}
        <div className="bg-white border border-neutral-200 p-7 sm:p-9 transition-all">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white mb-3">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-neutral-900">CREATE ACCOUNT</h1>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Join Vestro Wear House</p>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex p-1 bg-neutral-100 rounded-lg mb-6 text-xs font-bold uppercase tracking-wider">
            <Link
              href="/login"
              className="flex-1 py-2 text-center rounded-md text-neutral-600 hover:text-black transition"
            >
              Sign In
            </Link>
            <button
              type="button"
              className="flex-1 py-2 rounded-md bg-black text-white shadow-xs transition"
            >
              Register
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-none flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="font-medium flex-1">
                <span>{error}</span>
                {error.includes('আগেই') && (
                  <div className="mt-1.5">
                    <Link href="/login" className="font-bold underline text-black hover:opacity-80">
                      লগইন করতে এখানে ক্লিক করুন →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                আপনার নাম (Full Name)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Turjo"
                  disabled={loading}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-black transition disabled:bg-neutral-100 text-neutral-900 placeholder:text-neutral-400 font-medium"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                ইমেইল ঠিকানা (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  disabled={loading}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-black transition disabled:bg-neutral-100 text-neutral-900 placeholder:text-neutral-400 font-medium"
                />
              </div>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                ফোন নম্বর <span className="text-[10px] text-neutral-400 lowercase font-normal">(ঐচ্ছিক)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                  disabled={loading}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-black transition disabled:bg-neutral-100 text-neutral-900 placeholder:text-neutral-400 font-medium"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    disabled={loading}
                    required
                    className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-black transition disabled:bg-neutral-100 text-neutral-900 placeholder:text-neutral-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-3 text-neutral-400 hover:text-black transition"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  নিশ্চিত করুন
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="পুনরায় পাসওয়ার্ড"
                    disabled={loading}
                    required
                    className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-black transition disabled:bg-neutral-100 text-neutral-900 placeholder:text-neutral-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-3 text-neutral-400 hover:text-black transition"
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
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-3 px-4 rounded-none transition-all flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider disabled:opacity-60 mt-4 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                </>
              ) : (
                <span>অ্যাকাউন্ট তৈরি করুন (REGISTER)</span>
              )}
            </button>
          </form>

          {/* Terms Note */}
          <p className="text-[11px] text-neutral-500 text-center mt-4">
            রেজিস্ট্রেশন করার মাধ্যমে আপনি আমাদের{' '}
            <Link href="/terms" className="text-neutral-900 underline hover:text-black font-medium">
              শর্তাবলী
            </Link>{' '}
            ও{' '}
            <Link href="/privacy" className="text-neutral-900 underline hover:text-black font-medium">
              গোপনীয়তা নীতি
            </Link>{' '}
            মেনে নিচ্ছেন।
          </p>

          {/* Footer note */}
          <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-neutral-400 text-[11px] uppercase tracking-wider font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" />
            <span>Secure 256-Bit Encrypted Data Protection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
