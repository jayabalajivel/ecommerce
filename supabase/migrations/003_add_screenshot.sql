-- ============================================================
-- Migration: Add screenshot_url to orders
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS screenshot_url TEXT;
