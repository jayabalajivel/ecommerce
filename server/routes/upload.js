import { Router } from 'express';
import multer from 'multer';
import supabase from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/upload/screenshot
 * Upload a payment screenshot to Supabase Storage bucket 'receipts'
 */
router.post('/screenshot', requireAuth, upload.single('screenshot'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No screenshot file provided' });
  }

  try {
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `screenshots/${fileName}`;

    // Upload to Supabase Storage using the Service Role key
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Storage Upload Error:', error);
      return res.status(500).json({ error: 'Failed to upload screenshot to storage' });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    res.json({ url: publicUrl });
  } catch (err) {
    console.error('Upload catch error:', err);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
});

export default router;
