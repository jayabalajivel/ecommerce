import jwt from 'jsonwebtoken';
import supabase from '../lib/supabase.js';

/**
 * Verify JWT and attach user to req.user
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require admin role
 */
export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

/**
 * Check if a phone number is in the admin list
 */
export function isAdminPhone(phone) {
  const adminPhones = (process.env.ADMIN_PHONES || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
  return adminPhones.includes(phone);
}
