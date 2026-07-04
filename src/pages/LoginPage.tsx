import React, { useState } from 'react';
import { User, Shield, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { SEO } from '../components/SEO';
import logoImg from '../assets/logo.jpg';

interface LoginPageProps {
  onSuccess?: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const { sendOtp, verifyOtp, otpSent, loginType, setLoginType, resetOtpFlow } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length !== 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setIsLoading(true); setError('');
    try {
      const result = await sendOtp(phone);
      if (result.devOtp) setDevOtp(result.devOtp);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setIsLoading(true); setError('');
    try {
      await verifyOtp(phone, otp);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleTabSwitch(type: 'customer' | 'admin') {
    setLoginType(type);
    resetOtpFlow();
    setPhone(''); setOtp(''); setError(''); setDevOtp('');
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <SEO title="Login" description="Login to your  account." />
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
          <img src={logoImg} alt="Madurai Madasamy Idlypodi Logo" className="w-24 h-24 object-contain rounded-2xl shadow-lg mb-4 border border-border bg-white p-1" />
          <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            MADURAI MADASAMY IDLYPODI
          </h1>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
            Premium IdlyPodi & Thokku Co. 
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
          {/* Tab toggle */}
          <div className="grid grid-cols-2 border-b border-border">
            {(['customer', 'admin'] as const).map(type => (
              <button
                key={type}
                onClick={() => handleTabSwitch(type)}
                className={`py-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
                  loginType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {type === 'customer' ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                {type === 'customer' ? 'Customer' : 'Admin'}
              </button>
            ))}
          </div>

          <div className="p-7">
            <h2 className="text-lg font-semibold text-foreground mb-0.5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {loginType === 'customer' ? 'Welcome Back' : 'Admin Portal'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {loginType === 'customer' ? 'Sign in to browse and order' : 'Restricted access · Authorised personnel only'}
            </p>

            {/* Error banner */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Dev mode OTP hint */}
            {devOtp && (
              <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                🛠️ <strong>Dev Mode:</strong> OTP is <span className="font-mono font-bold tracking-widest">{devOtp}</span>
              </div>
            )}

            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              {/* Phone input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Mobile Number</label>
                <div className="flex gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-2.5 bg-muted rounded-lg border border-border text-sm font-medium text-foreground whitespace-nowrap">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    disabled={otpSent}
                    className="flex-1 px-3 py-2.5 bg-input rounded-lg border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-60"
                    required
                  />
                </div>
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
                      Change number
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
                  <p className="text-xs text-muted-foreground mt-1.5">OTP sent to +91 {phone}</p>
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
                <p className="text-center text-xs text-muted-foreground">
                  By continuing, you agree to our Terms of Service
                </p>
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
