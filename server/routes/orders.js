import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { sendReceiptEmail, sendAdminNotificationEmail } from '../lib/email.js';

const router = Router();

/**
 * POST /api/orders
 * Authenticated customers — create manual UPI order, decrement stock
 */
router.post('/', requireAuth, async (req, res) => {
  const { items, customer_name, email, address, payment_ref, notes, screenshot_url } = req.body;
  const userEmail = req.user.email;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart items are required' });
  }

  const nameTrimmed = (customer_name || '').trim();
  if (!nameTrimmed) {
    return res.status(400).json({ error: 'Customer name is required' });
  }
  if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) {
    return res.status(400).json({ error: 'Customer name must only contain letters and spaces (no numbers or special characters)' });
  }

  if (!address) {
    return res.status(400).json({ error: 'Delivery address is required' });
  }

  const emailTrimmed = (email || '').trim();
  if (!emailTrimmed) {
    return res.status(400).json({ error: 'Email address is required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const refTrimmed = (payment_ref || '').trim();
  if (!refTrimmed) {
    return res.status(400).json({ error: 'UPI Transaction ID is required' });
  }
  if (!/^\d{12}$/.test(refTrimmed)) {
    return res.status(400).json({ error: 'UPI Transaction ID must be exactly 12 digits' });
  }

  let phone = '';
  if (notes && notes.startsWith('Phone: ')) {
    phone = notes.replace('Phone: ', '').trim();
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }
  }

  // Validate stock and compute totals
  const productIds = items.map(i => i.product_id || i.id);
  const { data: products, error: fetchErr } = await supabase
    .from('products')
    .select('id, name, price, stock_qty, weight_label, weight_grams')
    .in('id', productIds);
  if (fetchErr) return res.status(500).json({ error: fetchErr.message });

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  // Check stock
  for (const item of items) {
    const pid = item.product_id || item.id;
    const product = productMap[pid];
    if (!product) return res.status(400).json({ error: `Product #${pid} not found` });
    if (product.stock_qty < item.qty) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name} (only ${product.stock_qty} left)` });
    }
  }

  const subtotal = items.reduce((sum, item) => {
    const product = productMap[item.product_id || item.id];
    return sum + (product.price * item.qty);
  }, 0);

  // Calculate delivery fee: free above 799, Tamil Nadu is 50, others weight-based (100 Rs/kg)
  let delivery_fee = 0;
  if (subtotal < 799) {
    let orderState = (req.body.state || '').trim();
    if (!orderState && address) {
      // Extract from concatenated address "Door No: ..., ..., ..., ..., State - Pincode"
      const parts = address.split(',');
      if (parts.length >= 5) {
        const lastPart = parts[parts.length - 1];
        const statePart = lastPart.split('-')[0].trim();
        orderState = statePart;
      }
    }

    const normState = orderState.toLowerCase().replace(/[\s\.\-_]/g, '');
    if (normState === 'tamilnadu' || normState === 'tn') {
      delivery_fee = 50;
    } else {
      delivery_fee = 100;
    }
  }

  const cgst = Math.round(subtotal * 0.025 * 100) / 100;
  const sgst = Math.round(subtotal * 0.025 * 100) / 100;
  const total = Math.round((subtotal + cgst + sgst + delivery_fee) * 100) / 100;

  // Generate order ID sequentially: ORD-001, ORD-002, etc.
  const { data: latestOrders, error: latestErr } = await supabase
    .from('orders')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(50);

  if (latestErr) {
    console.error('Failed to query latest orders for sequence:', latestErr);
  }

  let nextNum = 1;
  if (latestOrders && latestOrders.length > 0) {
    // Scan recent orders to find the latest one that matches sequential format (ORD- followed by 3 or 4 digits)
    for (const ord of latestOrders) {
      const match = ord.id.match(/^ORD-(\d{3,4})$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num < 10000) {
          nextNum = num + 1;
          break;
        }
      }
    }
  }
  const orderId = 'ORD-' + String(nextNum).padStart(3, '0');

  // Build order items payload
  const orderItems = items.map(item => {
    const product = productMap[item.product_id || item.id];
    return {
      product_id: product.id,
      name: product.name,
      price: product.price,
      qty: item.qty,
      weight: product.weight_label,
      subtotal: product.price * item.qty,
    };
  });

  const orderInsertData = {
    id: orderId,
    user_phone: userEmail,
    customer_name,
    address,
    items: orderItems,
    subtotal,
    delivery_fee,
    total,
    payment_ref,
    screenshot_url,
    notes,
    status: 'pending',
    email,
  };

  let order;

  // Create order resiliently
  const insertResult = await supabase
    .from('orders')
    .insert(orderInsertData)
    .select()
    .single();

  if (insertResult.error) {
    // If table column doesn't exist yet or is missing from schema cache, retry without it and append email to notes
    const code = insertResult.error.code;
    const message = insertResult.error.message || '';
    if (
      code === '42703' ||
      message.includes('column "email" of relation "orders" does not exist') ||
      message.includes('schema cache') ||
      message.includes("email' column")
    ) {
      const fallbackInsertData = { ...orderInsertData };
      delete fallbackInsertData.email;
      fallbackInsertData.notes = `[Email: ${email}] ${notes || ''}`.trim();
      
      const retryResult = await supabase
        .from('orders')
        .insert(fallbackInsertData)
        .select()
        .single();
        
      if (retryResult.error) {
        return res.status(500).json({ error: retryResult.error.message });
      }
      order = retryResult.data;
    } else {
      return res.status(500).json({ error: insertResult.error.message });
    }
  } else {
    order = insertResult.data;
  }

  // Decrement stock for each item
  for (const item of items) {
    const pid = item.product_id || item.id;
    const product = productMap[pid];
    await supabase
      .from('products')
      .update({ stock_qty: product.stock_qty - item.qty })
      .eq('id', pid);
  }

  // Trigger sending receipt email (asynchronously)
  sendReceiptEmail(order, email).catch(err => {
    console.error(`[Email Service] Failed asynchronously:`, err);
  });

  // Trigger sending admin notification email (asynchronously)
  sendAdminNotificationEmail(order).catch(err => {
    console.error(`[Admin Email Service] Failed asynchronously:`, err);
  });

  res.status(201).json({ order, message: 'Order placed successfully. Awaiting payment verification.' });
});

/**
 * GET /api/orders
 * Admin: all orders | Customer: own orders
 */
router.get('/', requireAuth, async (req, res) => {
  const { status, limit = 50 } = req.query;
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  if (req.user.role !== 'admin') {
    query = query.eq('user_phone', req.user.email);
  }
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ orders: data });
});

/**
 * GET /api/orders/:id
 * Get single order (admin or owner)
 */
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Order not found' });

  if (req.user.role !== 'admin' && data.user_phone !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ order: data });
});

/**
 * PUT /api/orders/:id/status
 * Admin — update order status
 */
router.put('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ order: data, message: 'Order status updated' });
});

export default router;
