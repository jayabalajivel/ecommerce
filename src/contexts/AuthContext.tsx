import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, adminApi } from '../lib/api';
import type { AdminSession } from '../lib/api';

interface User {
  phone: string;
  role: 'customer' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  adminSessionId: string | null;
  // OTP flow
  otpSent: boolean;
  loginType: 'customer' | 'admin';
  setLoginType: (t: 'customer' | 'admin') => void;
  sendOtp: (phone: string) => Promise<{ devOtp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
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

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('sk_token');
    const savedUser = localStorage.getItem('sk_user');
    if (token && savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        setUser(parsed);
        // Restore admin session ID if applicable
        const savedSession = localStorage.getItem('sk_admin_session');
        if (savedSession && parsed.role === 'admin') {
          setAdminSessionId(savedSession);
        }
      } catch (_) {
        localStorage.removeItem('sk_token');
        localStorage.removeItem('sk_user');
      }
    }
    setIsLoading(false);
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    const result = await authApi.sendOtp(phone);
    setOtpSent(true);
    return { devOtp: result.devOtp };
  }, []);

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    const result = await authApi.verifyOtp(phone, otp);
    localStorage.setItem('sk_token', result.token);
    localStorage.setItem('sk_user', JSON.stringify(result.user));
    setUser(result.user as User);
    setOtpSent(false);

    // Start admin session tracking
    if (result.user.role === 'admin') {
      try {
        const { session } = await adminApi.startSession();
        setAdminSessionId(session.id);
        localStorage.setItem('sk_admin_session', session.id);
      } catch (err) {
        console.error('Failed to start admin session:', err);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    // End admin session
    if (adminSessionId) {
      try {
        await adminApi.endSession(adminSessionId);
      } catch (_) {}
      localStorage.removeItem('sk_admin_session');
      setAdminSessionId(null);
    }
    await authApi.logout().catch(() => {});
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
    logout,
    resetOtpFlow,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
