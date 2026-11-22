import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

let cachedReviews = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function clearReviewsCache() {
  cachedReviews = null;
  cacheTime = 0;
}

/**
 * GET /api/reviews
 * Public — returns approved reviews. If admin session ID is present, it returns all reviews.
 */
router.get('/', async (req, res) => {
  const { admin_session } = req.query;
  
  // If not admin, use cache and Cache-Control
  if (!admin_session) {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    if (cachedReviews && (Date.now() - cacheTime < CACHE_TTL_MS)) {
      return res.json({ reviews: cachedReviews });
    }
  }

  let query = supabase
    .from('store_reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (!admin_session) {
    query = query.eq('is_approved', true);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  if (!admin_session) {
    cachedReviews = data;
    cacheTime = Date.now();
  }

  res.json({ reviews: data });
});

/**
 * POST /api/reviews
 * Public — create new review (is_approved = false by default)
 */
router.post('/', async (req, res) => {
  const { customer_name, rating, description } = req.body;
  
  if (!customer_name || !rating) {
    return res.status(400).json({ error: 'Customer name and rating are required' });
  }

  const { data, error } = await supabase
    .from('store_reviews')
    .insert({ customer_name, rating, description })
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ review: data, message: 'Review submitted successfully' });
});

/**
 * PUT /api/reviews/:id
 * Admin — update review (approve/hide/edit)
 */
router.put('/:id', requireAdmin, async (req, res) => {
  const reviewId = req.params.id;
  const { customer_name, rating, description, is_approved } = req.body;
  
  const updates = {};
  if (customer_name !== undefined) updates.customer_name = customer_name;
  if (rating !== undefined) updates.rating = rating;
  if (description !== undefined) updates.description = description;
  if (is_approved !== undefined) updates.is_approved = is_approved;

  const { data, error } = await supabase
    .from('store_reviews')
    .update(updates)
    .eq('id', reviewId)
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  clearReviewsCache();
  res.json({ review: data, message: 'Review updated successfully' });
});

/**
 * DELETE /api/reviews/:id
 * Admin — delete review
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  const reviewId = req.params.id;
  
  const { error } = await supabase
    .from('store_reviews')
    .delete()
    .eq('id', reviewId);
    
  if (error) return res.status(500).json({ error: error.message });
  clearReviewsCache();
  res.json({ message: 'Review deleted successfully' });
});

export default router;
