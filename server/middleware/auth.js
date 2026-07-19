import supabase from '../lib/supabase.js';

/**
 * Verify Supabase access token and attach user to req.user
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.slice(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = {
      email: user.email,
      role: isAdminEmail(user.email) ? 'admin' : 'customer'
    };
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
 * Check if an email is the predefined admin email
 */
export function isAdminEmail(email) {
  if (!email) return false;
  const adminEmail = (process.env.ADMIN_EMAIL || 'maduraimadasamyidlipodi@gmail.com').trim().toLowerCase();
  return email.trim().toLowerCase() === adminEmail;
}
