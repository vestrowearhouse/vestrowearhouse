'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, KeyRound, Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  
  const router = useRouter();

  // Step 1: Send OTP to Email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const csrfToken = typeof document !== 'undefined'
        ? document.cookie.split('; ').find((row) => row.startsWith('csrf_token='))?.split('=')[1]
        : null;

      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setSuccess(data.message || 'OTP sent to your email.');
      setStep(2); // Move to OTP step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const csrfToken = typeof document !== 'undefined'
        ? document.cookie.split('; ').find((row) => row.startsWith('csrf_token='))?.split('=')[1]
        : null;

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      setResetToken(data.resetToken); // Save token for password reset
      setSuccess('OTP is correct! Please set your new password.');
      setStep(3); // Move to New Password step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const csrfToken = typeof document !== 'undefined'
        ? document.cookie.split('; ').find((row) => row.startsWith('csrf_token='))?.split('=')[1]
        : null;

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      
      setSuccess('Password changed successfully! Redirecting to login...');
      setStep(4); // Success step
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Determine which form to submit based on current step
  const handleSubmit = (e) => {
    if (step === 1) handleSendOTP(e);
    else if (step === 2) handleVerifyOTP(e);
    else if (step === 3) handleResetPassword(e);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] py-16 px-4">
      <div className="max-w-md w-full bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-neutral-200">
        
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-neutral-400 uppercase block mb-1">
            Vestro Wear House
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 uppercase">Reset Password</h2>
          <p className="text-xs text-neutral-500 mt-2">
            {step === 1 && "Enter your email to receive a verification OTP"}
            {step === 2 && "Enter the OTP sent to your email"}
            {step === 3 && "Create a new strong password"}
            {step === 4 && "Password reset successful!"}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {success && step !== 4 && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

        {/* Main Form */}
        {step < 4 ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Email Box */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={step > 1 || loading}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-500 transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* 2. OTP Box */}
            {step >= 2 && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Enter OTP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    disabled={step > 2 || loading}
                    required={step === 2}
                    className="block w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-neutral-100 disabled:text-neutral-500 transition-colors"
                    placeholder="6-digit OTP"
                  />
                </div>
              </div>
            )}

            {/* 3. New Password Box */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-neutral-400" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-widest text-white bg-black hover:bg-neutral-800 focus:outline-none transition-colors disabled:bg-neutral-400"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 1 ? 'Send OTP' : step === 2 ? 'Verify OTP' : 'Change Password'}
            </button>
          </form>
        ) : (
          <div className="text-center py-6 animate-in zoom-in duration-300">
            <div className="mx-auto w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-neutral-700 mb-4">{success}</p>
            <Loader2 className="w-5 h-5 animate-spin text-neutral-900 mx-auto" />
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
          <Link href="/login" className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-black transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}