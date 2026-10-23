'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);


  // Check if user is logged in on mount
  useEffect(() => {
    try {
      const cachedUser = localStorage.getItem('currentUser');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
        setLoading(false);
      }
    } catch (err) {
      // ignore
    }

    // Defer auth check until after first paint so it doesn't compete with LCP
    const run = () => checkAuth();
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(run, { timeout: 2000 });
    } else {
      const t = setTimeout(run, 200);
      return () => clearTimeout(t);
    }
  }, []);



  const checkAuth = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`/api/auth/me?t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      });

      const data = await res.json();

      if (data.user) {
        setUser(data.user);
        try {
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        } catch (err) {
          // ignore
        }
      } else {
        setUser(null);
        try {
          localStorage.removeItem('currentUser');
        } catch (err) {
          // ignore
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[AuthContext] Auth check error:', error.message);
      }
      // Network error বা server error হলে localStorage এর user রেখে দাও
      // শুধু server থেকে explicitly { user: null } আসলে তখনই clear করো
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setIsCheckingAuth(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
    setLoading(false);
    setIsCheckingAuth(false);
    try {
      localStorage.setItem('currentUser', JSON.stringify(userData));
    } catch (err) {
      // ignore
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setUser(null);
      setIsCheckingAuth(false);
      try {
        localStorage.removeItem('currentUser');
      } catch (err) {
        console.warn('[AuthContext] Failed to clear cached user:', err);
      }

      // Call logout endpoint with credentials to clear session
      const res = await fetch('/api/auth/logout-v2', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });


      if (!res.ok) {
        console.error('[AuthContext] Logout API returned:', res.status);
      }

      // Hard reload to ensure Navbar + any in-memory state is re-synced
      try {
        window.location.href = '/';
      } catch {
        // ignore
      }


      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      setUser(null);
      try {
        localStorage.removeItem('currentUser');
      } catch (err) {
        console.warn('[AuthContext] Failed to clear cached user:', err);
      }
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      // Redirect to backend OAuth flow through Supabase
      window.location.href = '/api/auth/google-login/start';
      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: error.message || 'Google login failed' };
    } finally {
      setLoading(false);
    }
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isCheckingAuth, 
      login, 
      logout, 
      checkAuth, 
      loginWithGoogle,
      isLoginModalOpen,
      openLoginModal,
      closeLoginModal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
