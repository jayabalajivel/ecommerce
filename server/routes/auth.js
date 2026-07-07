import { Router } from 'express';
import jwt from 'jsonwebtoken';
import supabase from '../lib/supabase.js';
import { isAdminEmail } from '../middleware/auth.js';

const router = Router();

// In-memory OTP store for dev mode or fallback
const otpStore = new Map(); // email -> { otp, expiresAt }

/**
 * POST /api/auth/send-otp
 * Body: { email: "customer@example.com" }
 */
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: {
        shouldCreateUser: true
      }
    });
    if (error) throw error;
    res.json({ success: true, message: `OTP sent to ${trimmedEmail}` });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: err.message || 'Failed to send OTP' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Body: { email: "customer@example.com", otp: "123456" }
 */
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  let verified = false;

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: trimmedEmail,
      token: otp,
      type: 'email',
    });
    if (error) throw error;
    verified = !!data.session;
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(400).json({ error: err.message || 'OTP verification failed' });
  }

  if (!verified) {
    return res.status(400).json({ error: 'Verification failed' });
  }

  // Determine role
  const role = isAdminEmail(trimmedEmail) ? 'admin' : 'customer';

  // Upsert profile in DB
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ phone: trimmedEmail, email: trimmedEmail, role }, { onConflict: 'phone' });

  if (profileError) {
    console.error('Profile upsert error:', profileError);
  }

  // Issue JWT
  const token = jwt.sign(
    { email: trimmedEmail, role },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: { email: trimmedEmail, role },
    message: `Logged in as ${role}`,
  });
});

/**
 * POST /api/auth/google-login
 * Body: { email: "user@gmail.com" }
 */
router.post('/google-login', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Valid Google email is required' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const role = isAdminEmail(trimmedEmail) ? 'admin' : 'customer';

  // Upsert profile in DB
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ phone: trimmedEmail, email: trimmedEmail, role }, { onConflict: 'phone' });

  if (profileError) {
    console.error('Profile upsert error:', profileError);
  }

  // Issue JWT
  const token = jwt.sign(
    { email: trimmedEmail, role },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: { email: trimmedEmail, role },
    message: `Logged in with Google as ${role}`,
  });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

export default router;
