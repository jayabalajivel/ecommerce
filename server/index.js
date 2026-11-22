import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import achievementRoutes from './routes/achievements.js';
import uploadRoutes from './routes/upload.js';
import reviewRoutes from './routes/reviews.js';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

// ─── Security middleware ─────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    try {
      const parsed = new URL(origin);
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === 'maduraimadasamyidlipodi.com' ||
        host.endsWith('.maduraimadasamyidlipodi.com') ||
        host.endsWith('.vercel.app') ||
        (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)
      ) {
        return callback(null, true);
      }
    } catch {}
    callback(null, true);
  },
  credentials: true,
}));

// ─── Rate limiting ───────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const otpLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { error: 'Too many OTP requests. Wait 1 minute.' } });
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/', limiter);

// ─── Body parsing ────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV, version: '2.1' });
});

// ─── Live Email Diagnostic Endpoint ───────────────────────────
app.get('/api/debug-email', async (_req, res) => {
  const rawPass = process.env.SMTP_PASS || '';
  const passClean = rawPass.replace(/\s+/g, '').replace(/[\x22\x27]/g, '').trim();

  const report = {
    env: {
      SMTP_USER: process.env.SMTP_USER || null,
      SMTP_PASS_EXISTS: !!rawPass,
      SMTP_PASS_RAW_LEN: rawPass.length,
      SMTP_PASS_CLEAN_LEN: passClean.length,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || null,
      NODE_ENV: process.env.NODE_ENV,
      RENDER: process.env.RENDER || null
    },
    tests: []
  };

  // Test 1: Verify Port 465 SSL connection
  try {
    const t465 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: passClean },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000
    });
    await t465.verify();
    report.tests.push({ method: 'Port 465 SSL (Direct)', success: true });
  } catch (err) {
    report.tests.push({ method: 'Port 465 SSL (Direct)', success: false, error: err.message });
  }

  // Test 2: Verify Port 587 TLS connection
  try {
    const t587 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: passClean },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000
    });
    await t587.verify();
    report.tests.push({ method: 'Port 587 TLS (STARTTLS)', success: true });
  } catch (err) {
    report.tests.push({ method: 'Port 587 TLS (STARTTLS)', success: false, error: err.message });
  }

  // Test 3: Actual test email dispatch to Admin
  if (process.env.SMTP_USER && passClean) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: passClean },
        connectionTimeout: 10000
      });
      const info = await transporter.sendMail({
        from: `"Diagnostic Test" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        subject: `Live Server Email Test [${new Date().toLocaleTimeString('en-IN')}]`,
        text: 'Hello from your live server! Gmail SMTP is fully connected and operational.'
      });
      report.tests.push({ method: 'Send Test Email', success: true, messageId: info.messageId });
    } catch (err) {
      report.tests.push({ method: 'Send Test Email', success: false, error: err.message });
    }
  }

  res.json(report);
});

// ─── 404 handler ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(PORT, () => {
  console.log(`\nSpiceKraft API running on http://localhost:${PORT}`);
  console.log(`   Admin phones: ${process.env.ADMIN_PHONES || '(not set)'}`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL ? '✅ configured' : '❌ NOT configured'}\n`);
});

// Keepalive pinger for Render free tier (prevents service sleeping / 50s cold starts)
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (RENDER_URL) {
  console.log(`[Keepalive] Scheduled self-ping for ${RENDER_URL} every 14 minutes`);
  setInterval(() => {
    fetch(`${RENDER_URL}/api/health`)
      .then(r => r.json())
      .then(d => console.log(`[Keepalive] Self-ping status:`, d.status))
      .catch(err => console.error(`[Keepalive] Self-ping error:`, err.message));
  }, 14 * 60 * 1000);
}

export default app;
