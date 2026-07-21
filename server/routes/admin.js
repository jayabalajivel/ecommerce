import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/admin/session/start
 * Log admin login session
 */
router.post('/session/start', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('admin_sessions')
    .insert({
      admin_phone: req.user.email,
      ip_address: req.ip || req.headers['x-forwarded-for'],
      user_agent: req.headers['user-agent'],
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ session: data });
});

/**
 * POST /api/admin/session/:id/end
 * Log admin logout
 */
router.post('/session/:id/end', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('admin_sessions')
    .update({ logout_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('admin_phone', req.user.email)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ session: data });
});

/**
 * GET /api/admin/sessions
 * List all admin sessions
 */
router.get('/sessions', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('admin_sessions')
    .select('*')
    .order('login_at', { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ sessions: data });
});

/**
 * GET /api/admin/product-edits
 * Product edit audit log
 */
router.get('/product-edits', requireAdmin, async (req, res) => {
  const { product_id, limit = 100 } = req.query;
  let query = supabase
    .from('product_edits')
    .select('*')
    .order('edited_at', { ascending: false })
    .limit(parseInt(limit));
  if (product_id) query = query.eq('product_id', product_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ edits: data });
});

router.get('/dashboard', requireAdmin, async (req, res) => {
  const { range = 'all' } = req.query;

  let orderQuery = supabase.from('orders').select('id, status, total, created_at');

  if (range === 'week') {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    orderQuery = orderQuery.gte('created_at', oneWeekAgo.toISOString());
  } else if (range === 'month') {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    orderQuery = orderQuery.gte('created_at', oneMonthAgo.toISOString());
  }

  const [ordersRes, productsRes] = await Promise.all([
    orderQuery,
    supabase.from('products').select('id, name, stock_qty, is_active').eq('is_active', true),
  ]);

  const orders = ordersRes.data || [];
  const products = productsRes.data || [];

  const stats = {
    total_orders: orders.filter(o => o.status !== 'cancelled').length,
    total_revenue: orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total), 0),
    pending_orders: orders.filter(o => o.status === 'pending').length,
    processing_orders: orders.filter(o => o.status === 'processing').length,
    shipped_orders: orders.filter(o => o.status === 'shipped').length,
    delivered_orders: orders.filter(o => o.status === 'delivered').length,
    total_products: products.length,
    low_stock_products: products.filter(p => p.stock_qty < 10),
    out_of_stock_products: products.filter(p => p.stock_qty === 0).length,
  };

  res.json({ stats });
});

export default router;
