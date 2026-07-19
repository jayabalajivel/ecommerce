import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { adminApi } from '../lib/api';

interface User {
  email: string;
  role: 'customer' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  adminSessionId: string | null;
  otpSent: boolean;
  loginType: 'customer' | 'admin';
  setLoginType: (t: 'customer' | 'admin') => void;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetOtpFlow: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [loginType, setLoginType] = useState<'customer' | 'admin'>('customer');
  const [adminSessionId, setAdminSessionId] = useState<string | null>(null);

  // Sync session with Supabase auth changes (including page loads and redirects)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const token = session.access_token;
        const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'maduraimadasamyidlipodi@gmail.com').toLowerCase();
        const role = session.user.email?.toLowerCase() === adminEmail ? 'admin' : 'customer';
        const userPayload = { email: session.user.email || '', role };

        localStorage.setItem('sk_token', token);
        localStorage.setItem('sk_user', JSON.stringify(userPayload));
        setUser(userPayload as User);

        // Restore admin session ID if exists, or start a new one
        const savedSession = localStorage.getItem('sk_admin_session');
        if (role === 'admin') {
          if (savedSession) {
            setAdminSessionId(savedSession);
          } else {
            try {
              const { session: adminSess } = await adminApi.startSession();
              setAdminSessionId(adminSess.id);
              localStorage.setItem('sk_admin_session', adminSess.id);
            } catch (err) {
              console.error('Failed to start admin session:', err);
            }
          }
        }
      } else {
        localStorage.removeItem('sk_token');
        localStorage.removeItem('sk_user');
        localStorage.removeItem('sk_admin_session');
        setUser(null);
        setAdminSessionId(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      }
    });
    if (error) throw error;
    setOtpSent(true);
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });
    if (error) throw error;
    if (!data.session) throw new Error('Verification failed. Invalid OTP.');
    setOtpSent(false);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const redirectUrl = window.location.origin + '/login';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    if (adminSessionId) {
      try {
        await adminApi.endSession(adminSessionId);
      } catch (_) {}
      localStorage.removeItem('sk_admin_session');
      setAdminSessionId(null);
    }
    await supabase.auth.signOut();
    localStorage.removeItem('sk_token');
    localStorage.removeItem('sk_user');
    setUser(null);
    setOtpSent(false);
  }, [adminSessionId]);

  const resetOtpFlow = useCallback(() => {
    setOtpSent(false);
  }, []);

  const value: AuthContextType = {
    user,
    isAdmin: user?.role === 'admin',
    isLoading,
    adminSessionId,
    otpSent,
    loginType,
    setLoginType,
    sendOtp,
    verifyOtp,
    loginWithGoogle,
    logout,
    resetOtpFlow,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
