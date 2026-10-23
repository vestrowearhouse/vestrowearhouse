# Supabase Database Setup Instructions

## Quick Setup via Supabase Dashboard

Since direct SQL execution requires the Supabase CLI or Dashboard, follow these steps:

### Option 1: Execute SQL in Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `vgdejacoshvwpvbdpiqf`
3. **Go to SQL Editor**: Click "SQL Editor" in the left sidebar
4. **Copy and paste** the SQL below
5. **Click "Run"** to execute

### Option 2: Using Supabase CLI (Alternative)

If you have the Supabase CLI installed, run:

```bash
supabase db execute --project-ref vgdejacoshvwpvbdpiqf --file supabase-schema.sql
```

---

## SQL Schema to Execute

Copy the entire SQL below and execute it in the Supabase SQL Editor:

```sql
-- Supabase SQL Schema for StellarMartBD
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'vendor')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login TIMESTAMP,
  address JSONB,
  reset_password_token TEXT,
  reset_password_expire TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expire TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  last_failed_login TIMESTAMP,
  otp_attempts INTEGER DEFAULT 0,
  last_otp_request TIMESTAMP,
  wishlist JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  category TEXT,
  category_slug TEXT,
  images JSONB DEFAULT '[]',
  stock INTEGER DEFAULT 0,
  sku TEXT,
  vendor_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  featured BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '[]',
  sizes JSONB DEFAULT '[]',
  colors JSONB DEFAULT '[]',
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  order_number TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC NOT NULL,
  shipping_cost NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'failed', 'refunded')),
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  parent_id UUID REFERENCES categories(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  user_usage_limit INTEGER DEFAULT 1,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT,
  image TEXT NOT NULL,
  link TEXT,
  position INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendors profile
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  shop_name TEXT NOT NULL,
  shop_address TEXT,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','pending')),
  verification_badge BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendor product requests
CREATE TABLE IF NOT EXISTS vendor_product_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('create','edit','delete')),
  product_id UUID REFERENCES products(id),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendor orders
CREATE TABLE IF NOT EXISTS vendor_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  items JSONB NOT NULL DEFAULT '[]',
  vendor_status TEXT NOT NULL DEFAULT 'pending' CHECK (vendor_status IN ('pending','processing','shipped','delivered','rejected','cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(order_id, vendor_id)
);

-- Vendor notifications
CREATE TABLE IF NOT EXISTS vendor_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vpr_vendor_id ON vendor_product_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vpr_status ON vendor_product_requests(status);
CREATE INDEX IF NOT EXISTS idx_vorders_vendor_id ON vendor_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vorders_order_id ON vendor_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_vnotif_vendor_id ON vendor_notifications(vendor_id);

-- Insert default admin users
INSERT INTO users (name, email, password, phone, role, status, email_verified) VALUES
('turjo', 'turjo@stellarmartbd.com', 'turjo0424', '01712345678', 'admin', 'active', TRUE),
('ashik', 'ashik@stellarmartbd.com', 'ashik2008', '01712345679', 'admin', 'active', TRUE)
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role;
```

---

## After Setup - Update Environment Variables

After successfully setting up the database in Supabase, add these environment variables to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://vgdejacoshvwpvbdpiqf.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnZGVqYWNvc2h2d3B2YmRwaXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1OTM4MzYsImV4cCI6MjA5MzE2OTgzNn0.UK7xrjK8gIYxS7TEiqm8Jf9y3C545dufQtoEO5o1mp8
```

## Tables Created

| Table | Description |
|-------|-------------|
| `users` | User accounts (customers, admins, vendors) |
| `products` | Product catalog |
| `orders` | Customer orders |
| `categories` | Product categories |
| `coupons` | Discount coupons |
| `banners` | Homepage banners |
| `settings` | Site settings |
| `cart` | Shopping cart data |

## Default Admin Users

| Email | Password | Role |
|-------|----------|------|
| turjo@stellarmartbd.com | turjo0424 | admin |
| ashik@stellarmartbd.com | ashik2008 | admin |

---

## Verification

After executing the SQL, verify tables were created:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;

-- Check admin users
SELECT name, email, role FROM users WHERE role = 'admin';
