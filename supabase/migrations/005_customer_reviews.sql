-- ============================================================
-- Customer Reviews Table
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS store_reviews (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  description TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE store_reviews ENABLE ROW LEVEL SECURITY;

-- Public read for approved reviews
CREATE POLICY "Public read approved reviews" ON store_reviews 
  FOR SELECT USING (is_approved = true);

-- Public insert for new reviews (unapproved by default)
CREATE POLICY "Public insert reviews" ON store_reviews 
  FOR INSERT WITH CHECK (is_approved = false);

-- ── Seed: Reviews ──────────────────────────────────────────────
INSERT INTO store_reviews (customer_name, rating, description, is_approved) VALUES
  ('Anjali Sharma', 5, 'The spices are incredibly fresh! My biryani has never tasted better. Will definitely order again.', true),
  ('Rahul Verma', 4, 'Great quality, especially the Kashmiri chilli powder. Delivery was a bit late but products are top notch.', true),
  ('Priya K.', 5, 'Authentic flavours! The blended masalas save me so much time in the kitchen without compromising on taste.', true)
ON CONFLICT DO NOTHING;
