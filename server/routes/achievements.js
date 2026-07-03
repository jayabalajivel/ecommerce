import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/achievements
 * Public — list achievements
 */
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('sort_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ achievements: data });
});

/**
 * PUT /api/achievements/:id
 * Admin — update achievement
 */
router.put('/:id', requireAdmin, async (req, res) => {
  const { title, value, description, icon } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (value !== undefined) updates.value = value;
  if (description !== undefined) updates.description = description;
  if (icon !== undefined) updates.icon = icon;

  const { data, error } = await supabase
    .from('achievements')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ achievement: data });
});

/**
 * POST /api/achievements
 * Admin — create new achievement
 */
router.post('/', requireAdmin, async (req, res) => {
  const { title, value, description, icon } = req.body;
  if (!title || !value) {
    return res.status(400).json({ error: 'Title and value are required' });
  }

  const { data, error } = await supabase
    .from('achievements')
    .insert({ title, value, description, icon })
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ achievement: data });
});

/**
 * DELETE /api/achievements/:id
 * Admin — delete achievement
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  const achievementId = parseInt(req.params.id);
  
  const { error } = await supabase
    .from('achievements')
    .delete()
    .eq('id', achievementId);
    
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Achievement deleted successfully' });
});

export default router;
