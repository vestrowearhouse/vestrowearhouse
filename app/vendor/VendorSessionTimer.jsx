'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Clock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VendorSessionTimer() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 min display window
  const [isWarning, setIsWarning] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const startTime = Date.now();
    const sessionStart = parseInt(sessionStorage.getItem('vendorSessionStart') || startTime, 10);

    if (!sessionStorage.getItem('vendorSessionStart')) {
      sessionStorage.setItem('vendorSessionStart', startTime.toString());
    }

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      const remaining = Math.max(0, (15 * 60) - elapsed);

      setTimeLeft(remaining);
      setIsWarning(remaining <= 180); // under 3 mins

      if (remaining <= 0) {
        clearInterval(timer);
        sessionStorage.clear();
        router.push('/vendor?expired=true');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
        isWarning
          ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
          : 'bg-emerald-50/80 text-emerald-800 border-emerald-200/70'
      }`}
      title="Active secure vendor session timeout"
    >
      {isWarning ? (
        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
      ) : (
        <Shield className="w-3.5 h-3.5 text-emerald-600" />
      )}
      <span>Session expires in: <strong className="font-mono">{formatTime(timeLeft)}</strong></span>
    </div>
  );
}
