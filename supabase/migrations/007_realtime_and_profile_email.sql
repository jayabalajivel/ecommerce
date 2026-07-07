-- ============================================================
-- Migration: Add email column to profiles and enable Realtime
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Populate email column from phone if phone contains an email address
UPDATE profiles SET email = phone WHERE phone LIKE '%@%';

-- 3. Create supabase_realtime publication if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 4. Enable Realtime replication for key tables by adding them to publication
-- We use a safe check by dropping if exists before adding to avoid duplicate registration errors
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS orders;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS products;
ALTER PUBLICATION supabase_realtime ADD TABLE products;

ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
