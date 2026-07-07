# SpiceKraft Database Schema & Activities Documentation

Welcome developer! If you are visiting our Supabase project, this guide will clarify our database schema, tracking mechanisms, real-time settings, and where to look to monitor user activities.

---

## 1. Table Schema Overview

### `profiles`
Stores user authentication profiles and roles.
- `id` (UUID, Primary Key): Unique profile identifier.
- `phone` (TEXT, Unique): Used for OTP authentication matching (legacy mapping).
- `email` (TEXT, Unique): Explicitly stores user email address (populated on registration/login).
- `role` (TEXT): `'customer'` or `'admin'`.
- `created_at` (TIMESTAMPTZ): Profile creation timestamp.

### `orders`
Stores order details, transaction references, and taxes.
- `id` (TEXT, Primary Key): Unique order number (e.g., `ORD-12345`).
- `user_phone` (TEXT): The email of the customer who ordered.
- `customer_name` (TEXT): Display name.
- `address` (TEXT): Detailed delivery address.
- `items` (JSONB): Array of products with pricing and quantity details.
- `subtotal` (NUMERIC): Original product cost.
- `delivery_fee` (NUMERIC): Shipping charges.
- `total` (NUMERIC): Grand total paid (calculated as `subtotal + CGST (2.5%) + SGST (2.5%) + delivery_fee`).
- `status` (TEXT): Current tracking state (`pending`, `processing`, `shipped`, `delivered`, `cancelled`).
- `payment_ref` (TEXT): 12-digit UPI Transaction reference ID.
- `screenshot_url` (TEXT): Link to uploaded payment proof image.
- `email` (TEXT): Confirmation receipt email address.
- `created_at` / `updated_at` (TIMESTAMPTZ): Status tracking timestamps.

### `products`
The main inventory table.
- `id` (SERIAL, Primary Key): Product identifier.
- `category_id` (TEXT): References categories.
- `name` / `description` (TEXT): Product details.
- `price` (NUMERIC): Selling price.
- `original_price` (NUMERIC): original/crossed-out price.
- `stock_qty` (INT): Current quantity remaining.
- `weight_label` (TEXT): Pack weight (e.g., `200g`).
- `image_url` (TEXT): Unsplash or custom storage image link.

---

## 2. Activity Tracking (Audits)

We log important administrative actions so you can track changes directly in Supabase:

### Admin Login Log (`admin_sessions`)
Logs every time an administrator logs in.
- `id` (UUID, Primary Key)
- `admin_phone` (TEXT): Login email.
- `login_at` / `logout_at` (TIMESTAMPTZ): Timestamps.
- `ip_address` / `user_agent` (TEXT): Client details.
- `actions_count` (INT): Tracks updates made in this session.

### Product Changes Log (`product_edits`)
Logs every change an admin makes to products (e.g., price modifications, stock updates).
- `id` (UUID)
- `product_id` (INT)
- `product_name` (TEXT)
- `admin_phone` (TEXT): Who modified it.
- `session_id` (UUID): References the active `admin_sessions`.
- `field_changed` (TEXT): The property name (e.g. `price`, `stock_qty`).
- `old_value` / `new_value` (TEXT): Before/after values.
- `edited_at` (TIMESTAMPTZ): Edit timestamp.

---

## 3. Realtime Replication

Realtime data replication has been enabled for:
- `orders`
- `products`
- `profiles`

To listen to real-time events (insert/update/delete) in the client, subscribe via the Supabase client:
```javascript
import { supabase } from './supabase';

const channel = supabase
  .channel('table-db-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Realtime Order Change:', payload);
    }
  )
  .subscribe();
```
All realtime tables are registered under the `supabase_realtime` publication in your Postgres database.
