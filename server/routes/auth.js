import { Router } from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../lib/supabase.js';
import { isAdminPhone } from '../middleware/auth.js';

const router = Router();

// In-memory OTP store for dev mode (replace with Twilio/Supabase in prod)
const otpStore = new Map(); // phone -> { otp, expiresAt }

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/send-otp
 * Body: { phone: "9876543210" }
 */
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || !/^\d{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });
  }

  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Dev mode: OTP is always 123456
    const otp = '123456';
    otpStore.set(phone, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
    return res.json({
      success: true,
      message: `[DEV MODE] OTP is 123456 (check server console)`,
      devOtp: otp,
    });
  }

  // Production: Use Supabase Phone Auth (requires Twilio configured)
  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+91${phone}`,
    });
    if (error) throw error;
    res.json({ success: true, message: `OTP sent to +91 ${phone}` });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: err.message || 'Failed to send OTP' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Body: { phone: "9876543210", otp: "123456" }
 */
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP are required' });
  }

  const isDev = process.env.NODE_ENV !== 'production';
  let verified = false;

  if (isDev) {
    const stored = otpStore.get(phone);
    if (!stored) return res.status(400).json({ error: 'OTP not found. Please request a new one.' });
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
    }
    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }
    otpStore.delete(phone);
    verified = true;
  } else {
    // Production: verify with Supabase
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otp,
        type: 'sms',
      });
      if (error) throw error;
      verified = !!data.session;
    } catch (err) {
      console.error('Verify OTP error:', err);
      return res.status(400).json({ error: err.message || 'OTP verification failed' });
    }
  }

  if (!verified) {
    return res.status(400).json({ error: 'Verification failed' });
  }

  // Determine role
  const role = isAdminPhone(phone) ? 'admin' : 'customer';

  // Upsert profile in DB
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ phone, role }, { onConflict: 'phone' });

  if (profileError) {
    console.error('Profile upsert error:', profileError);
    // Non-fatal — continue
  }

  // Issue JWT
  const token = jwt.sign(
    { phone, role },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: { phone, role },
    message: `Logged in as ${role}`,
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  // JWT is stateless; client clears the token
  res.json({ success: true });
});

export default router;
