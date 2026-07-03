-- ============================================================
-- SpiceKraft Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Categories ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  product_count INT DEFAULT 0,
  sort_order INT DEFAULT 0
);

-- ── Products ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id TEXT REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  weight_grams INT DEFAULT 100,
  weight_label TEXT DEFAULT '100g',
  stock_qty INT DEFAULT 50,
  rating NUMERIC(3,1) DEFAULT 4.5,
  reviews INT DEFAULT 0,
  image_url TEXT,
  badge TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Orders ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT ('ORD-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0')),
  user_phone TEXT NOT NULL,
  customer_name TEXT,
  address TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  upi_id TEXT,
  payment_ref TEXT,
  screenshot_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Admin Sessions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_phone TEXT NOT NULL,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  actions_count INT DEFAULT 0
);

-- ── Product Edit Log ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id INT REFERENCES products(id),
  product_name TEXT,
  admin_phone TEXT NOT NULL,
  session_id UUID REFERENCES admin_sessions(id),
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  edited_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Achievements ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  sort_order INT DEFAULT 0
);

-- ── RLS Policies ────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Public read for categories, products, achievements
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read achievements" ON achievements FOR SELECT USING (true);

-- Service role bypasses RLS (backend uses service role key)
-- All write operations done via service role from backend

-- ── Auto-update updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Seed: Categories ─────────────────────────────────────────
INSERT INTO categories (id, name, description, image_url, product_count, sort_order) VALUES
  ('whole', 'Whole Spices', 'Pure, unprocessed spices for maximum aroma', 'https://images.unsplash.com/photo-1589536677029-c0aa1808fba6?w=600&h=380&fit=crop&auto=format', 12, 1),
  ('ground', 'Ground Spices', 'Stone-ground fresh before packaging', 'https://images.unsplash.com/photo-1615485500834-bc10199bc727?w=600&h=380&fit=crop&auto=format', 15, 2),
  ('blended', 'Blended Masala', 'Traditional family recipes, perfected for generations', 'https://images.unsplash.com/photo-1529517986296-847580704921?w=600&h=380&fit=crop&auto=format', 18, 3),
  ('seeds', 'Seeds & Grains', 'Hand-sorted, farm-fresh tempering spices', 'https://images.unsplash.com/photo-1622042914684-6a6288b14078?w=600&h=380&fit=crop&auto=format', 10, 4),
  ('special', 'Premium Collection', 'Rare and exotic spices sourced across India', 'https://images.unsplash.com/photo-1486548730767-5c679e8eda6b?w=600&h=380&fit=crop&auto=format', 8, 5)
ON CONFLICT (id) DO NOTHING;

-- ── Seed: Products ───────────────────────────────────────────
INSERT INTO products (category_id, name, description, price, original_price, weight_grams, weight_label, stock_qty, rating, reviews, image_url, badge) VALUES
  ('whole', 'Green Cardamom', 'Hand-picked from Idukki forests. Intense aroma, perfect for chai and desserts.', 249, 299, 100, '100g', 45, 4.8, 324, 'https://images.unsplash.com/photo-1701190884222-a2139c70ab84?w=400&h=400&fit=crop&auto=format', 'Bestseller'),
  ('whole', 'Ceylon Cinnamon Sticks', 'True cinnamon from Sri Lanka. Mild, sweet, and highly aromatic bark.', 179, 219, 150, '150g', 38, 4.7, 198, 'https://images.unsplash.com/photo-1589536677029-c0aa1808fba6?w=400&h=400&fit=crop&auto=format', NULL),
  ('whole', 'Tellicherry Black Pepper', 'Premium large-berry pepper from Malabar coast. Bold, complex flavour.', 199, 249, 150, '150g', 52, 4.9, 412, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop&auto=format', 'Top Rated'),
  ('whole', 'Zanzibar Cloves', 'Plump, oil-rich cloves with intense fragrance. Freshness guaranteed.', 229, 279, 100, '100g', 29, 4.6, 156, 'https://images.unsplash.com/photo-1591272216626-b09e38519371?w=400&h=400&fit=crop&auto=format', NULL),
  ('whole', 'Star Anise', 'Whole pods, essential for biryani and slow-cooked gravies.', 159, 189, 100, '100g', 61, 4.5, 89, 'https://images.unsplash.com/photo-1525289722380-f5bf1653d504?w=400&h=400&fit=crop&auto=format', NULL),
  ('ground', 'Golden Turmeric Powder', 'Lakadong turmeric with 5.5% curcumin. Lab-verified purity.', 119, 149, 250, '250g', 74, 4.9, 623, 'https://images.unsplash.com/photo-1615485500834-bc10199bc727?w=400&h=400&fit=crop&auto=format', 'Organic'),
  ('ground', 'Kashmiri Red Chili Powder', 'Vibrant red colour, mild heat. Perfect for tandoori and rich curries.', 149, 189, 200, '200g', 88, 4.8, 441, 'https://images.unsplash.com/photo-1625921133217-8d978f7872b8?w=400&h=400&fit=crop&auto=format', 'Bestseller'),
  ('ground', 'Coriander Seed Powder', 'Fresh-ground from premium Rajasthani coriander seeds.', 89, 109, 250, '250g', 43, 4.5, 287, 'https://images.unsplash.com/photo-1702041295331-840d4d9aa7c9?w=400&h=400&fit=crop&auto=format', NULL),
  ('ground', 'Cumin Powder', 'Rich, earthy, and nutty. Ground just before packing to preserve oils.', 109, 139, 200, '200g', 55, 4.7, 319, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop&auto=format', NULL),
  ('blended', 'Garam Masala', 'Classic North Indian blend. 16 spices, roasted and stone-ground.', 169, 209, 100, '100g', 97, 4.9, 784, 'https://images.unsplash.com/photo-1529517986296-847580704921?w=400&h=400&fit=crop&auto=format', 'Family Recipe'),
  ('blended', 'Hyderabadi Biryani Masala', 'Authentic dum biryani blend. 24-spice formula from old city kitchens.', 199, 249, 100, '100g', 34, 4.8, 531, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop&auto=format', 'Bestseller'),
  ('blended', 'Kerala Chicken Masala', 'Coconut-balanced South Indian blend. Authentic Malabar taste.', 179, 219, 100, '100g', 41, 4.7, 298, 'https://images.unsplash.com/photo-1529517986296-847580704921?w=400&h=400&fit=crop&auto=format', NULL),
  ('blended', 'Sambar Powder', 'Traditional Tamil Nadu recipe. A staple for South Indian homes.', 129, 159, 200, '200g', 66, 4.6, 445, 'https://images.unsplash.com/photo-1702041295331-840d4d9aa7c9?w=400&h=400&fit=crop&auto=format', NULL),
  ('seeds', 'Black Mustard Seeds', 'Sharp, pungent tempering mustard. Essential for South Indian tadka.', 79, 99, 250, '250g', 83, 4.5, 189, 'https://images.unsplash.com/photo-1622042914684-6a6288b14078?w=400&h=400&fit=crop&auto=format', NULL),
  ('seeds', 'Sweet Fennel Seeds', 'Plump, aromatic Lucknow saunf. For curries and as a mouth freshener.', 99, 119, 200, '200g', 57, 4.7, 234, 'https://images.unsplash.com/photo-1622042914579-f5d10cf8ea4d?w=400&h=400&fit=crop&auto=format', NULL),
  ('seeds', 'Fenugreek Seeds', 'Slightly bitter, health-packed methi seeds. Excellent for curries and hair care.', 69, 89, 250, '250g', 71, 4.4, 167, 'https://images.unsplash.com/photo-1622042914684-6a6288b14078?w=400&h=400&fit=crop&auto=format', NULL),
  ('special', 'Kashmir Saffron (Mongra)', 'Pure Grade A Kashmiri Mongra saffron threads. Certified by JKICDS.', 1299, 1599, 1, '1g', 7, 5.0, 89, 'https://images.unsplash.com/photo-1486548730767-5c679e8eda6b?w=400&h=400&fit=crop&auto=format', 'Premium'),
  ('special', 'Malabar Pepper Extra Bold', '5mm+ berries from Wayanad. The gold standard of black pepper.', 449, 549, 100, '100g', 18, 4.9, 124, 'https://images.unsplash.com/photo-1525289722380-f5bf1653d504?w=400&h=400&fit=crop&auto=format', 'Rare'),
  ('special', 'Coorg Vanilla Pods', 'Bourbon-style vanilla from Kodagu. Rich, floral, and deeply indulgent.', 699, 849, 10, '10g', 5, 4.8, 67, 'https://images.unsplash.com/photo-1591272216626-b09e38519371?w=400&h=400&fit=crop&auto=format', 'Rare');

-- ── Seed: Achievements ───────────────────────────────────────
INSERT INTO achievements (title, value, description, icon, sort_order) VALUES
  ('Happy Customers', '2,50,000+', 'Satisfied families across India', '👥', 1),
  ('Years of Heritage', '35+', 'Three generations of spice expertise', '🏆', 2),
  ('Products Available', '180+', 'Curated spices and masala blends', '🫙', 3),
  ('States Served', '28', 'Pan-India delivery network', '🗺️', 4),
  ('Awards Won', '12', 'National food quality recognitions', '🥇', 5),
  ('Partner Farms', '340+', 'Direct farm-to-table sourcing', '🌾', 6)
ON CONFLICT DO NOTHING;
