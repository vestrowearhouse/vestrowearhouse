'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, LogOut, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SessionTimer() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes in seconds
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/admin-logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      sessionStorage.clear();
      router.push('/admin-login?expired=true');
    }
  }, [router]);

  // Main timer countdown - HARD TIMEOUT (no reset on activity)
  useEffect(() => {
    const startTime = Date.now();
    const sessionStart = parseInt(sessionStorage.getItem('sessionStart') || startTime);
    
    if (!sessionStorage.getItem('sessionStart')) {
      sessionStorage.setItem('sessionStart', startTime);
    }

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
      const remaining = Math.max(0, (10 * 60) - elapsed);
      
      setTimeLeft(remaining);
      
      // Set warning states
      if (remaining === 120) {
        setShowAlert(true);
        // Show browser notification if available
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Session Expiring Soon', {
            body: 'Your admin session will expire in 2 minutes. Please save your work.',
            icon: '⏰',
          });
        }
      }
      
      if (remaining <= 120) setIsWarning(true);
      if (remaining <= 60) setIsCritical(true);
      
      // Auto logout when time is up
      if (remaining === 0) {
        clearInterval(timer);
        handleLogout();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [handleLogout]);

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-opacity-10 transition-all duration-300" 
           style={{
             backgroundColor: isCritical ? '#fee2e2' : isWarning ? '#fef3c7' : 'transparent',
           }}>
        <Shield className={`w-5 h-5 transition-colors ${
          isCritical ? 'text-red-600 animate-pulse' : isWarning ? 'text-amber-600' : 'text-green-600'
        }`} />
        
        <span className={`text-sm font-semibold transition-colors whitespace-nowrap ${
          isCritical ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-gray-700'
        }`}>
          Session expires in: {formatTime(timeLeft)}
        </span>
        
        {isCritical && (
          <button
            onClick={handleLogout}
            className="ml-2 p-1 hover:bg-red-200 rounded transition-colors"
            title="Logout now"
          >
            <LogOut className="w-4 h-4 text-red-600" />
          </button>
        )}
      </div>

      {/* Alert for 2 minute warning */}
      {showAlert && !isCritical && (
        <div className="fixed top-4 right-4 bg-amber-50 border-2 border-amber-200 rounded-lg shadow-lg p-4 max-w-sm z-40">
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-amber-900">Session Expiring Soon</h3>
              <p className="text-sm text-amber-800 mt-1">
                Your admin session will expire in 2 minutes. Please save your work.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
