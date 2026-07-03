-- ============================================================
-- Fix Foreign Key Constraints for Deletes
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop the existing constraint
ALTER TABLE product_edits 
DROP CONSTRAINT IF EXISTS product_edits_product_id_fkey;

-- Add it back with ON DELETE CASCADE
ALTER TABLE product_edits 
ADD CONSTRAINT product_edits_product_id_fkey 
  FOREIGN KEY (product_id) 
  REFERENCES products(id) 
  ON DELETE CASCADE;
