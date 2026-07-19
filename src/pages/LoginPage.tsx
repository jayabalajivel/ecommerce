import React, { useState, useEffect } from 'react';
import { User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';
import logoImg from '../assets/logo.jpg';

interface LoginPageProps {
  onSuccess?: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const { user, sendOtp, verifyOtp, otpSent, loginType, setLoginType, resetOtpFlow } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if session exists or finishes authenticating
  useEffect(() => {
    if (user) {
      if (onSuccess) onSuccess(); else navigate('/');
    }
  }, [user, navigate, onSuccess]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    setIsLoading(true); setError('');
    try {
      await sendOtp(email.trim());
    } catch (err: any) {
      console.error("OTP Send Error:", err);
      setError(formatError(err, 'Failed to send verification code.'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setIsLoading(true); setError('');
    try {
      await verifyOtp(email.trim(), otp);
    } catch (err: any) {
      console.error("OTP Verify Error:", err);
      setError(formatError(err, 'OTP verification failed. Please check the code.'));
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      const redirectUrl = window.location.origin + '/login';
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (oauthErr) throw oauthErr;
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      setError(formatError(err, 'Google Sign-in failed'));
      setIsLoading(false);
    }
  };

  function formatError(err: any, fallback: string): string {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    
    // Check common error fields
    if (err.message && typeof err.message === 'string') return err.message;
    if (err.error_description && typeof err.error_description === 'string') return err.error_description;
    if (err.error && typeof err.error === 'string') return err.error;
    
    // Detailed object logging
    try {
      const keys = Object.keys(err);
      if (keys.length > 0) {
        return keys.map(k => `${k}: ${typeof err[k] === 'object' ? JSON.stringify(err[k]) : err[k]}`).join(', ');
      }
      
      const str = err.toString ? err.toString() : '';
      if (str && str !== '[object Object]') return str;
    } catch (_) {}
    
    return fallback;
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <SEO title="Login" description="Login to your account." />
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1716816211590-c15a328a5ff0?w=1400&h=900&fit=crop&auto=format)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/96 to-primary/8" />

      <div className="relative z-10 w-full max-w-[420px] mx-auto px-5">
        {/* Brand */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src={logoImg} alt="Madurai Madasamy Idli Podi Logo" className="w-24 h-24 object-contain rounded-2xl shadow-lg mb-4 border border-border bg-white p-1" />
          <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            MADURAI MADASAMY IDLI PODI
          </h1>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
            Premium IdlyPodi & Thokku Co. 
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          <div className="p-7">
            <h2 className="text-xl font-bold text-foreground mb-1 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
              Welcome Back
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6 italic">
              "Taste of Tradition, Quality in Every Spoon."
            </p>

            {/* Error banner */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              {/* Email input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={otpSent}
                  className="w-full px-3 py-2.5 bg-input rounded-lg border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60"
                  required
                />
              </div>

              {/* OTP input */}
              {otpSent && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">OTP</label>
                    <button
                      type="button"
                      onClick={() => { resetOtpFlow(); setOtp(''); setError(''); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Change email
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="• • • • • •"
                    autoFocus
                    className="w-full px-3 py-3 bg-input rounded-lg border border-border text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 tracking-[0.5em] text-center transition-all"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">OTP sent to {email}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : null}
                {otpSent ? 'Verify & Sign In' : 'Send OTP'}
              </button>

              {!otpSent && (
                <>
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink mx-4 text-xs uppercase text-muted-foreground font-semibold">Or</span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-3 bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-xl font-semibold text-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-sm"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Continue with Google
                  </button>

                  <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
                    * If you receive a magic link email instead of a code, simply click the link in your email and you will be signed in automatically.
                  </p>
                </>
              )}
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-70">
          © 2026 MADURAI MADASAMY IDLYPODI. Crafted with ❤️ in TAMILNADU
        </p>
      </div>
    </div>
  );
}
