'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const registered = searchParams.get('registered') === 'true';
  const verified = searchParams.get('verified') === 'true';
  const error = searchParams.get('error');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (!email || resendCooldown > 0) return;
    
    try {
      setResendCooldown(60);
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        console.error('Failed to resend email');
      }
    } catch (err) {
      console.error('Error resending verification email:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-2xl border border-gray-100">
        {/* Verified Success State */}
        {verified && (
          <>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Email Verified!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Your email has been successfully verified.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm text-center">
              Your account is now active and ready to use.
            </div>

            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Proceed to Login
            </Link>
          </>
        )}

        {/* Error State */}
        {error && (
          <>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Verification Failed
              </h2>
            </div>

            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResendEmail}
                disabled={resendCooldown > 0}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
              </button>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </div>
          </>
        )}

        {/* Pending Verification State */}
        {!verified && !error && (
          <>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Verify Your Email
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {registered 
                  ? 'Welcome! Please verify your email to activate your account.'
                  : 'A verification link has been sent to your email.'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-900 mb-2 font-semibold">
                {email || 'Your email'}
              </p>
              <p className="text-sm text-blue-800">
                Check your inbox and spam folder for a verification link from Vestro Wear House.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                The verification link will expire in 24 hours.
              </p>

              <button
                onClick={handleResendEmail}
                disabled={resendCooldown > 0}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
              </button>

              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Link>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Already verified? {' '}
              <Link href="/login" className="text-blue-600 hover:underline font-semibold">
                Login here
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="text-lg font-semibold text-gray-600">Loading verification...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
