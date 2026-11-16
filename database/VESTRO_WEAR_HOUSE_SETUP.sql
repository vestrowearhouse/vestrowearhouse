-- ==============================================================================
-- VESTRO WEAR HOUSE: COMPLETE DATABASE SETUP
-- Clean, Vendor-Free, High-Fashion & Streetwear Schema
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. ENUM TYPES
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('info', 'warning', 'event', 'alert');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_recipient_type') THEN
    CREATE TYPE notification_recipient_type AS ENUM ('all', 'all_users', 'single_user');
  END IF;
END $$;

-- 3. CORE TABLES

-- Table: activity_logs
CREATE TABLE IF NOT EXISTS public."activity_logs" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "table_name" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "record_id" TEXT,
  "details" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: admins
CREATE TABLE IF NOT EXISTS public."admins" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "phone" TEXT,
  "avatar" TEXT,
  "status" TEXT DEFAULT 'active'::text,
  "last_login" TIMESTAMP WITHOUT TIME ZONE,
  "login_attempts" INTEGER DEFAULT 0,
  "last_failed_login" TIMESTAMP WITHOUT TIME ZONE,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "locked_until" TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY ("id")
);

-- Table: banners
CREATE TABLE IF NOT EXISTS public."banners" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "title" TEXT,
  "subtitle" TEXT,
  "image" TEXT NOT NULL,
  "mobile_image" TEXT,
  "link" TEXT DEFAULT '/shop'::text,
  "button_text" TEXT DEFAULT 'EXPLORE COLLECTION'::text,
  "position" INTEGER DEFAULT 0,
  "status" TEXT DEFAULT 'active'::text,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: build_logs
CREATE TABLE IF NOT EXISTS public."build_logs" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "status" TEXT NOT NULL,
  "commit_message" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: carts
CREATE TABLE IF NOT EXISTS public."carts" (
  "session_id" TEXT NOT NULL,
  "items" JSONB DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("session_id")
);

-- Table: categories
CREATE TABLE IF NOT EXISTS public."categories" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "image" TEXT,
  "parent_id" UUID,
  "status" TEXT DEFAULT 'active'::text,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "icon" TEXT DEFAULT '👕'::text,
  "isFeatured" BOOLEAN DEFAULT true,
  "icon_type" TEXT DEFAULT 'emoji'::text,
  "sku_category_code" TEXT,
  PRIMARY KEY ("id")
);

-- Table: chat_sessions
CREATE TABLE IF NOT EXISTS public."chat_sessions" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "user_id" UUID,
  "session_token" TEXT NOT NULL UNIQUE,
  "session_type" TEXT DEFAULT 'customer'::text,
  "status" TEXT DEFAULT 'ai'::text,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: chat_messages
CREATE TABLE IF NOT EXISTS public."chat_messages" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "session_id" UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  "sender" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: coupons
CREATE TABLE IF NOT EXISTS public."coupons" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "code" TEXT NOT NULL UNIQUE,
  "discount_type" TEXT DEFAULT 'percentage'::text,
  "discount_value" NUMERIC NOT NULL,
  "min_order_amount" NUMERIC DEFAULT 0,
  "max_discount_amount" NUMERIC,
  "usage_limit" INTEGER DEFAULT 1000,
  "used_count" INTEGER DEFAULT 0,
  "user_usage_limit" INTEGER DEFAULT 1,
  "start_date" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "end_date" TIMESTAMP WITHOUT TIME ZONE,
  "status" TEXT DEFAULT 'active'::text,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: marketing_campaigns
CREATE TABLE IF NOT EXISTS public."marketing_campaigns" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT DEFAULT 'active'::text,
  "budget" NUMERIC DEFAULT 0,
  "spent" NUMERIC DEFAULT 0,
  "conversions" INTEGER DEFAULT 0,
  "roi" NUMERIC DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: messages
CREATE TABLE IF NOT EXISTS public."messages" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "sender_id" UUID,
  "receiver_id" UUID,
  "content" TEXT NOT NULL,
  "is_read" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS public."notifications" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "sender_id" UUID,
  "recipient_id" UUID,
  "recipient_type" TEXT DEFAULT 'all'::text,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT DEFAULT 'info'::text,
  "is_read" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: orders
CREATE TABLE IF NOT EXISTS public."orders" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "user_id" UUID,
  "order_number" TEXT NOT NULL UNIQUE,
  "items" JSONB DEFAULT '[]'::jsonb NOT NULL,
  "subtotal" NUMERIC NOT NULL,
  "shipping_cost" NUMERIC DEFAULT 0,
  "tax" NUMERIC DEFAULT 0,
  "total" NUMERIC NOT NULL,
  "status" TEXT DEFAULT 'pending'::text,
  "payment_method" TEXT DEFAULT 'cod'::text,
  "payment_status" TEXT DEFAULT 'unpaid'::text,
  "shipping_address" JSONB,
  "billing_address" JSONB,
  "notes" TEXT,
  "coupon_code" TEXT,
  "discount" NUMERIC DEFAULT 0,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: page_logs
CREATE TABLE IF NOT EXISTS public."page_logs" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "route_path" TEXT NOT NULL,
  "error_code" INTEGER NOT NULL,
  "user_ip" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: page_views
CREATE TABLE IF NOT EXISTS public."page_views" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "visitor_id" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "browser" TEXT,
  "os" TEXT,
  "device_type" TEXT,
  "country" TEXT,
  "referer" TEXT,
  "event_type" TEXT DEFAULT 'page_view'::text,
  "user_id" UUID,
  "session_id" TEXT,
  "referrer" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: products
CREATE TABLE IF NOT EXISTS public."products" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "shortDescription" TEXT,
  "price" NUMERIC NOT NULL,
  "regularPrice" NUMERIC DEFAULT 0,
  "sellingPrice" NUMERIC DEFAULT 0,
  "oldPrice" NUMERIC DEFAULT 0,
  "original_price" NUMERIC,
  "discountPercent" INTEGER,
  "category" TEXT,
  "category_slug" TEXT,
  "category_code" TEXT,
  "sku" TEXT UNIQUE,
  "legacy_sku" TEXT,
  "brand" TEXT DEFAULT 'Vestro Wear House'::text,
  "tags" JSONB DEFAULT '[]'::jsonb,
  "images" JSONB DEFAULT '[]'::jsonb,
  "featuredImage" TEXT,
  "stock" INTEGER DEFAULT 0,
  "stockQuantity" INTEGER DEFAULT 0,
  "stockStatus" TEXT DEFAULT 'in_stock'::text,
  "isFeatured" BOOLEAN DEFAULT false,
  "isNewArrival" BOOLEAN DEFAULT true,
  "isBestSeller" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "status" TEXT DEFAULT 'active'::text,
  "rating" NUMERIC DEFAULT 5.0,
  "review_count" INTEGER DEFAULT 0,
  "sold_count" INTEGER DEFAULT 0,
  "attributes" JSONB DEFAULT '[]'::jsonb,
  "variants" JSONB DEFAULT '[]'::jsonb,
  "sizes" JSONB DEFAULT '[]'::jsonb,
  "colors" JSONB DEFAULT '[]'::jsonb,
  "fts" TSVECTOR,
  "embedding" VECTOR(768),
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: product_questions
CREATE TABLE IF NOT EXISTS public."product_questions" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "product_id" TEXT NOT NULL,
  "user_id" TEXT,
  "question" TEXT NOT NULL,
  "asker_name" TEXT DEFAULT 'Anonymous'::text NOT NULL,
  "answer" TEXT,
  "answerer" TEXT,
  "answered_at" TIMESTAMP WITH TIME ZONE,
  "answered_by" TEXT,
  "status" TEXT DEFAULT 'approved'::text,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: product_reviews
CREATE TABLE IF NOT EXISTS public."product_reviews" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "product_id" TEXT NOT NULL,
  "user_id" TEXT,
  "customer_name" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "images" JSONB DEFAULT '[]'::jsonb,
  "verified_purchase" BOOLEAN DEFAULT true,
  "status" TEXT DEFAULT 'approved'::text,
  "helpful_count" INTEGER DEFAULT 0,
  "admin_reply" TEXT,
  "admin_reply_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: settings
CREATE TABLE IF NOT EXISTS public."settings" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "site_name" TEXT DEFAULT 'Vestro Wear House'::text,
  "site_tagline" TEXT DEFAULT 'Premium Streetwear & Modern Fashion'::text,
  "email" TEXT DEFAULT 'support@vestrowearhouse.com'::text,
  "phone" TEXT DEFAULT '+880 1345-447500'::text,
  "whatsapp" TEXT DEFAULT '+880 1345-447500'::text,
  "address" TEXT DEFAULT 'Dhaka, Bangladesh'::text,
  "delivery_fee_dhaka" NUMERIC DEFAULT 60,
  "delivery_fee_outside" NUMERIC DEFAULT 120,
  "free_shipping_threshold" NUMERIC DEFAULT 2500,
  "logo_url" TEXT DEFAULT '/vestro-logo-dark.png'::text,
  "facebook_url" TEXT DEFAULT 'https://facebook.com/vestrowearhouse'::text,
  "instagram_url" TEXT DEFAULT 'https://instagram.com/vestrowearhouse'::text,
  "youtube_url" TEXT,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: users
CREATE TABLE IF NOT EXISTS public."users" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "phone" TEXT,
  "avatar" TEXT,
  "role" TEXT DEFAULT 'customer'::text,
  "status" TEXT DEFAULT 'active'::text,
  "last_login" TIMESTAMP WITHOUT TIME ZONE,
  "address" JSONB,
  "wishlist" JSONB DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: wishlists
CREATE TABLE IF NOT EXISTS public."wishlists" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "user_id" UUID,
  "product_id" UUID REFERENCES public.products(id) ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- 4. SKU ARCHITECTURE & LOOKUP TABLES

CREATE TABLE IF NOT EXISTS public.sku_categories (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    last_serial INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sizes (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.colors (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hex TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sku_registry (
    sku TEXT PRIMARY KEY,
    product_id UUID,
    variant_key TEXT,
    category_code TEXT REFERENCES public.sku_categories(code),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed SKU Categories for Apparel & Fashion
INSERT INTO public.sku_categories (code, name, group_name, last_serial) VALUES
('20', 'T-Shirts & Tops', 'Apparel', 0),
('21', 'Casual Shirts', 'Apparel', 0),
('22', 'Polos', 'Apparel', 0),
('23', 'Pants, Cargo & Jeans', 'Apparel', 0),
('24', 'Hoodies & Sweatshirts', 'Apparel', 0),
('25', 'Jackets & Outerwear', 'Apparel', 0),
('26', 'Shorts & Sweatpants', 'Apparel', 0),
('70', 'Hats, Caps & Beanies', 'Accessories', 0),
('71', 'Bags & Backpacks', 'Accessories', 0),
('72', 'Socks & Essentials', 'Accessories', 0),
('99', 'Exclusive Drops', 'Collections', 0)
ON CONFLICT (code) DO NOTHING;

-- Seed Sizes
INSERT INTO public.sizes (code, name, sort_order) VALUES
('01', 'XS', 1),
('02', 'S', 2),
('03', 'M', 3),
('04', 'L', 4),
('05', 'XL', 5),
('06', '2XL', 6),
('07', '3XL', 7),
('99', 'Free Size', 99)
ON CONFLICT (code) DO NOTHING;

-- Seed Colors
INSERT INTO public.colors (code, name, hex) VALUES
('01', 'Jet Black', '#000000'),
('02', 'Pure White', '#FFFFFF'),
('03', 'Heather Grey', '#9CA3AF'),
('04', 'Oatmeal / Beige', '#E5E0D8'),
('05', 'Navy Blue', '#0F172A'),
('06', 'Olive Green', '#3F4E38'),
('07', 'Washed Brown', '#583D28'),
('08', 'Crimson Red', '#991B1B')
ON CONFLICT (code) DO NOTHING;

-- 5. SEED INITIAL VESTRO WEAR HOUSE DATA

-- Default Settings
INSERT INTO public.settings (
  site_name, site_tagline, email, phone, whatsapp, address, 
  delivery_fee_dhaka, delivery_fee_outside, free_shipping_threshold, logo_url
) VALUES (
  'Vestro Wear House',
  'Premium Streetwear & Modern Fashion Flagship',
  'support@vestrowearhouse.com',
  '+880 1345-447500',
  '+880 1345-447500',
  'Dhaka, Bangladesh',
  60,
  120,
  2500,
  '/vestro-logo-dark.png'
) ON CONFLICT DO NOTHING;

-- Default Categories (Streetwear Focus)
INSERT INTO public.categories (name, slug, description, image, icon, isFeatured, sort_order, sku_category_code) VALUES
('T-Shirts', 't-shirts', 'Heavyweight, oversized, and essential graphic tees.', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', '👕', true, 1, '20'),
('Hoodies & Sweats', 'hoodies-sweats', 'French terry and fleece heavyweight streetwear hoodies.', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80', '🧥', true, 2, '24'),
('Jackets & Outerwear', 'outerwear', 'Minimalist zip jackets, bombers, and streetwear coats.', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80', '🧥', true, 3, '25'),
('Pants & Cargo', 'pants-cargo', 'Relaxed fit carpenter jeans, utility cargo, and tailored trousers.', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80', '👖', true, 4, '23'),
('Caps & Accessories', 'accessories', 'Signature caps, tote bags, and fashion accessories.', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80', '🧢', true, 5, '70')
ON CONFLICT (slug) DO NOTHING;

-- Default Hero Banner
INSERT INTO public.banners (title, subtitle, image, link, button_text, position, status) VALUES
('NEW DROP: VESTRO ESSENTIALS', 'DISCOVER THE LATEST STREETWEAR SILHOUETTES CRAFTED WITH PREMIUM HEAVYWEIGHT COTTON', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=85', '/shop', 'EXPLORE COLLECTION', 1, 'active'),
('OVERSIZED HEAVYWEIGHT FLEECE', 'SIGNATURE RELAXED FIT HOODIES DESIGNED FOR URBAN COMFORT', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&auto=format&fit=crop&q=85', '/category/hoodies-sweats', 'SHOP HOODIES', 2, 'active')
ON CONFLICT DO NOTHING;

-- Default Coupon
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, usage_limit, status) VALUES
('VESTRO10', 'percentage', 10, 1000, 1000, 'active'),
('WELCOME', 'fixed', 150, 1500, 500, 'active')
ON CONFLICT (code) DO NOTHING;

-- Sample Featured Fashion Apparel
INSERT INTO public.products (
  name, slug, description, shortDescription, price, regularPrice, sellingPrice, 
  discountPercent, category, category_slug, category_code, sku, brand, 
  featuredImage, images, stock, stockQuantity, stockStatus, isFeatured, isNewArrival,
  attributes, variants
) VALUES 
(
  'Vestro Heavyweight Boxy Tee - Jet Black',
  'vestro-heavyweight-boxy-tee-black',
  '<p>Crafted from 280 GSM 100% combed cotton, this boxy silhouette tee offers clean drape, dropped shoulders, and a reinforced ribbed collar for maximum longevity.</p>',
  '280 GSM 100% combed cotton boxy streetwear tee.',
  1250, 1650, 1250, 24, 'T-Shirts', 't-shirts', '20', 'VWH200001', 'Vestro Wear House',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&auto=format&fit=crop&q=80',
  '["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=900&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  100, 100, 'in_stock', true, true,
  '[{"name": "Size", "values": ["S", "M", "L", "XL", "2XL"]}]'::jsonb,
  '[
    {"sku": "VWH200001-S", "stock": 20, "price": 1250, "attributes": {"Size": "S"}},
    {"sku": "VWH200001-M", "stock": 30, "price": 1250, "attributes": {"Size": "M"}},
    {"sku": "VWH200001-L", "stock": 30, "price": 1250, "attributes": {"Size": "L"}},
    {"sku": "VWH200001-XL", "stock": 20, "price": 1250, "attributes": {"Size": "XL"}}
  ]'::jsonb
),
(
  'Signature Raw-Edge French Terry Hoodie',
  'signature-french-terry-hoodie-grey',
  '<p>Constructed with 420 GSM French Terry cotton. Features an oversized double-layered hood, kangaroo pocket with concealed stitching, and ribbed cuffs.</p>',
  '420 GSM premium French terry relaxed fit hoodie.',
  2450, 2950, 2450, 17, 'Hoodies & Sweats', 'hoodies-sweats', '24', 'VWH240001', 'Vestro Wear House',
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop&q=80',
  '["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  60, 60, 'in_stock', true, true,
  '[{"name": "Size", "values": ["M", "L", "XL"]}]'::jsonb,
  '[
    {"sku": "VWH240001-M", "stock": 20, "price": 2450, "attributes": {"Size": "M"}},
    {"sku": "VWH240001-L", "stock": 25, "price": 2450, "attributes": {"Size": "L"}},
    {"sku": "VWH240001-XL", "stock": 15, "price": 2450, "attributes": {"Size": "XL"}}
  ]'::jsonb
),
(
  'Vestro Utility Carpenter Cargo Pants',
  'vestro-utility-carpenter-cargo-pants',
  '<p>Heavyweight cotton twill utility pants featuring hammer loop, multi-pocket tool detailing, and a relaxed straight-leg cut designed to sit naturally over sneakers.</p>',
  'Durable cotton twill relaxed straight-leg cargo pants.',
  2150, 2600, 2150, 17, 'Pants & Cargo', 'pants-cargo', '23', 'VWH230001', 'Vestro Wear House',
  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=900&auto=format&fit=crop&q=80',
  '["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=900&auto=format&fit=crop&q=80"]'::jsonb,
  45, 45, 'in_stock', true, true,
  '[{"name": "Size", "values": ["30", "32", "34", "36"]}]'::jsonb,
  '[
    {"sku": "VWH230001-30", "stock": 10, "price": 2150, "attributes": {"Size": "30"}},
    {"sku": "VWH230001-32", "stock": 15, "price": 2150, "attributes": {"Size": "32"}},
    {"sku": "VWH230001-34", "stock": 15, "price": 2150, "attributes": {"Size": "34"}},
    {"sku": "VWH230001-36", "stock": 5, "price": 2150, "attributes": {"Size": "36"}}
  ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- 6. ATOMIC SKU GENERATOR FUNCTION
CREATE OR REPLACE FUNCTION public.generate_next_skus(
    p_category_code TEXT,
    p_count INT DEFAULT 1,
    p_product_id UUID DEFAULT NULL,
    p_variant_keys TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_end_serial INT;
    v_start_serial INT;
    v_curr_serial INT;
    v_serial_str TEXT;
    v_sku TEXT;
    v_skus JSONB := '[]'::JSONB;
    v_idx INT := 1;
    v_var_key TEXT;
    v_cat_exists BOOLEAN;
BEGIN
    IF p_count < 1 THEN
        p_count := 1;
    END IF;

    -- Validate category
    SELECT is_active INTO v_cat_exists
    FROM public.sku_categories
    WHERE code = p_category_code;

    IF v_cat_exists IS NULL THEN
        -- Insert fallback category if not found
        INSERT INTO public.sku_categories (code, name, group_name, last_serial)
        VALUES (p_category_code, 'Apparel Category ' || p_category_code, 'Apparel', 0)
        ON CONFLICT (code) DO NOTHING;
    END IF;

    -- Atomically increment serial counter
    UPDATE public.sku_categories
    SET last_serial = last_serial + p_count
    WHERE code = p_category_code
    RETURNING last_serial INTO v_end_serial;

    v_start_serial := v_end_serial - p_count + 1;

    FOR v_curr_serial IN v_start_serial..v_end_serial LOOP
        IF v_curr_serial < 10000 THEN
            v_serial_str := LPAD(v_curr_serial::TEXT, 4, '0');
        ELSE
            v_serial_str := v_curr_serial::TEXT;
        END IF;

        v_sku := 'VWH' || p_category_code || v_serial_str;

        v_var_key := NULL;
        IF p_variant_keys IS NOT NULL AND array_length(p_variant_keys, 1) >= v_idx THEN
            v_var_key := p_variant_keys[v_idx];
        END IF;

        INSERT INTO public.sku_registry (sku, product_id, variant_key, category_code, created_at)
        VALUES (v_sku, p_product_id, v_var_key, p_category_code, NOW())
        ON CONFLICT (sku) DO NOTHING;

        v_skus := v_skus || to_jsonb(v_sku);
        v_idx := v_idx + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'category_code', p_category_code,
        'count', p_count,
        'skus', v_skus
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_next_skus(TEXT, INT, UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_skus(TEXT, INT, UUID, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_next_skus(TEXT, INT, UUID, TEXT[]) TO anon;

-- 7. AI SEMANTIC SEARCH RPC FUNCTION
CREATE OR REPLACE FUNCTION public.match_products (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  price numeric,
  sellingPrice numeric,
  regularPrice numeric,
  category text,
  category_slug text,
  images jsonb,
  featuredImage text,
  stock int,
  stockQuantity int,
  stockStatus text,
  status text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    products.name,
    products.slug,
    products.description,
    products.price,
    products.sellingPrice,
    products.regularPrice,
    products.category,
    products.category_slug,
    products.images,
    products.featuredImage,
    products.stock,
    products.stockQuantity,
    products.stockStatus,
    products.status,
    (1 - (products.embedding <=> query_embedding))::float AS similarity
  FROM products
  WHERE products.status = 'active'
    AND products.embedding IS NOT NULL
    AND 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.match_products(vector(768), float, int) TO anon;
GRANT EXECUTE ON FUNCTION public.match_products(vector(768), float, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_products(vector(768), float, int) TO service_role;

-- 8. ANALYTICS SUMMARY RPC FUNCTION
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
    days_back integer DEFAULT 30,
    excluded_visitors text[] DEFAULT '{}'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
    start_ts timestamptz := now() - (days_back || ' days')::interval;
    chart_start_ts timestamptz := date_trunc('day', now() - interval '6 days');
BEGIN
    WITH
    filtered AS (
        SELECT 
            path, 
            visitor_id, 
            COALESCE(NULLIF(device_type, ''), 'desktop') AS device_type, 
            COALESCE(NULLIF(os, ''), 'Unknown') AS os, 
            COALESCE(NULLIF(browser, ''), 'Unknown') AS browser, 
            created_at
        FROM public.page_views
        WHERE created_at >= start_ts
          AND (excluded_visitors IS NULL OR array_length(excluded_visitors, 1) IS NULL OR NOT (visitor_id = ANY(excluded_visitors)))
    ),
    summary AS (
        SELECT 
            count(*)::bigint AS total_views,
            count(DISTINCT visitor_id)::bigint AS unique_visitors
        FROM filtered
    ),
    traffic AS (
        SELECT 
            to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day_str,
            count(*)::bigint AS views,
            count(DISTINCT visitor_id)::bigint AS visitors
        FROM filtered
        WHERE created_at >= chart_start_ts
        GROUP BY 1
        ORDER BY 1 ASC
    )
    SELECT json_build_object(
        'total_views', COALESCE((SELECT total_views FROM summary), 0),
        'unique_visitors', COALESCE((SELECT unique_visitors FROM summary), 0),
        'traffic_history', COALESCE((SELECT json_agg(t) FROM traffic t), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_summary(integer, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_analytics_summary(integer, text[]) TO authenticated;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on core tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

-- Public READ for storefront
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active banners" ON public.banners;
CREATE POLICY "Public can view active banners" ON public.banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.product_reviews;
CREATE POLICY "Public can view approved reviews" ON public.product_reviews FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Public can view approved questions" ON public.product_questions;
CREATE POLICY "Public can view approved questions" ON public.product_questions FOR SELECT USING (status = 'approved');

-- Service Role Full Access (Bypasses RLS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
