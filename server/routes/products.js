import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/products
 * Public — returns all active products with stock info
 */
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('id');

  if (category) query = query.eq('category_id', category);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ products: data });
});

/**
 * GET /api/products/categories
 * Public — returns all categories
 */
router.get('/categories', async (_req, res) => {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  if (error) return res.status(500).json({ error: error.message });

  // Calculate actual product counts per category
  const { data: products, error: pError } = await supabase
    .from('products')
    .select('category_id');
    
  if (!pError && products) {
    const counts = {};
    products.forEach(p => {
      counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    });
    categories.forEach(cat => {
      cat.product_count = counts[cat.id] || 0;
    });
  }

  res.json({ categories });
});

/**
 * POST /api/products/categories
 * Admin — create new category
 */
router.post('/categories', requireAdmin, async (req, res) => {
  const { id, name, description, image_url, sort_order } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name are required' });

  const { data, error } = await supabase
    .from('categories')
    .insert({ id, name, description, image_url, sort_order })
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ category: data });
});

/**
 * PUT /api/products/categories/:id
 * Admin — update category
 */
router.put('/categories/:id', requireAdmin, async (req, res) => {
  const { name, description, image_url, sort_order } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (image_url !== undefined) updates.image_url = image_url;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.json({ category: data });
});

/**
 * DELETE /api/products/categories/:id
 * Admin — delete category (and cascade delete products inside it)
 */
router.delete('/categories/:id', requireAdmin, async (req, res) => {
  const categoryId = req.params.id;
  
  try {
    // Find all products in this category
    const { data: productsInCat, error: fetchErr } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', categoryId);
      
    if (fetchErr) throw fetchErr;

    if (productsInCat && productsInCat.length > 0) {
      const productIds = productsInCat.map(p => p.id);
      
      // Delete product edits first to avoid foreign key constraints
      const { error: editsDelErr } = await supabase
        .from('product_edits')
        .delete()
        .in('product_id', productIds);
      if (editsDelErr) throw editsDelErr;

      // Delete products
      const { error: prodDelErr } = await supabase
        .from('products')
        .delete()
        .in('id', productIds);
      if (prodDelErr) throw prodDelErr;
    }

    // Now delete the category
    const { error: catDelErr } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
    if (catDelErr) throw catDelErr;

    res.json({ message: 'Category and its products deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/products/:id
 * Public — single product
 */
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Product not found' });
  res.json({ product: data });
});

/**
 * PUT /api/products/:id
 * Admin — update product details + log edit
 */
router.put('/:id', requireAdmin, async (req, res) => {
  const productId = parseInt(req.params.id);
  const {
    name, description, price, original_price,
    weight_grams, weight_label, stock_qty,
    image_url, badge, is_active,
    session_id,
  } = req.body;

  // Fetch current product for audit log
  const { data: current, error: fetchErr } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  if (fetchErr) return res.status(404).json({ error: 'Product not found' });

  const updates = {};
  const editLogs = [];

  const fields = {
    name, description, price, original_price,
    weight_grams, weight_label, stock_qty,
    image_url, badge, is_active,
  };

  Object.entries(fields).forEach(([key, val]) => {
    if (val !== undefined && String(val) !== String(current[key])) {
      editLogs.push({
        product_id: productId,
        product_name: current.name,
        admin_phone: req.user.email,
        session_id: session_id || null,
        field_changed: key,
        old_value: String(current[key] ?? ''),
        new_value: String(val),
      });
      updates[key] = val;
    }
  });

  if (Object.keys(updates).length === 0) {
    return res.json({ product: current, message: 'No changes detected' });
  }

  const { data: updated, error: updateErr } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();
  if (updateErr) return res.status(500).json({ error: updateErr.message });

  // Log edits
  if (editLogs.length > 0) {
    const { error: logErr } = await supabase.from('product_edits').insert(editLogs);
    if (logErr) console.error('Edit log error:', logErr);
  }

  // Bump session action count
  if (session_id) {
    const { error: rpcErr } = await supabase.rpc('increment_session_actions', { session_uuid: session_id });
    if (rpcErr) console.error(rpcErr);
  }

  res.json({ product: updated, edits_logged: editLogs.length, message: 'Product updated successfully' });
});

/**
 * PATCH /api/products/:id/stock
 * Admin — quick stock update
 */
router.patch('/:id/stock', requireAdmin, async (req, res) => {
  const { stock_qty, session_id } = req.body;
  if (typeof stock_qty !== 'number' || stock_qty < 0) {
    return res.status(400).json({ error: 'stock_qty must be a non-negative number' });
  }

  const productId = parseInt(req.params.id);

  const { data: current } = await supabase.from('products').select('name, stock_qty').eq('id', productId).single();

  const { data, error } = await supabase
    .from('products')
    .update({ stock_qty })
    .eq('id', productId)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });

  // Log the stock change
  if (current && String(current.stock_qty) !== String(stock_qty)) {
    await supabase.from('product_edits').insert({
      product_id: productId,
      product_name: current.name,
      admin_phone: req.user.email,
      session_id: session_id || null,
      field_changed: 'stock_qty',
      old_value: String(current.stock_qty),
      new_value: String(stock_qty),
    });
  }

  res.json({ product: data, message: 'Stock updated' });
});

/**
 * POST /api/products
 * Admin — create new product
 */
router.post('/', requireAdmin, async (req, res) => {
  const {
    category_id, name, description, price, original_price,
    weight_grams, weight_label, stock_qty, image_url, badge,
  } = req.body;
  if (!name || !price || !category_id) {
    return res.status(400).json({ error: 'name, price, category_id are required' });
  }
  const { data, error } = await supabase
    .from('products')
    .insert({ category_id, name, description, price, original_price, weight_grams, weight_label, stock_qty, image_url, badge })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ product: data });
});

/**
 * DELETE /api/products/:id
 * Admin — delete product
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  const productId = parseInt(req.params.id);
  
  try {
    // Delete product edits first to avoid foreign key constraints
    const { error: editsDelErr } = await supabase
      .from('product_edits')
      .delete()
      .eq('product_id', productId);
    if (editsDelErr) throw editsDelErr;

    // Delete product
    const { error: prodDelErr } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    if (prodDelErr) throw prodDelErr;

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
