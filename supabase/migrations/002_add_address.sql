-- ============================================================
-- Migration: Add address column to orders
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS address TEXT;
