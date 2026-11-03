-- ==============================================================================
-- STELLARMARTBD: STEP 1 - COMPLETE SCHEMA + SKU SYSTEM SETUP
-- Paste and run this first in your NEW Supabase project's SQL Editor.
-- ==============================================================================

-- ==============================================================================
-- STELLARMARTBD: AUTOMATICALLY EXTRACTED POSTGRESQL SCHEMA
-- Extracted from: https://vgdejacoshvwpvbdpiqf.supabase.co
-- Date: 2026-11-03T13:11:25.291Z
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('info', 'warning', 'event', 'alert');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_recipient_type') THEN
    CREATE TYPE notification_recipient_type AS ENUM ('all', 'all_users', 'all_vendors', 'single_user', 'single_vendor');
  END IF;
END $$;

-- Table: public."activity_logs"
CREATE TABLE IF NOT EXISTS public."activity_logs" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "table_name" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "record_id" TEXT,
  "details" JSONB,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."admins"
CREATE TABLE IF NOT EXISTS public."admins" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
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

-- Table: public."banners"
CREATE TABLE IF NOT EXISTS public."banners" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "title" TEXT,
  "image" TEXT NOT NULL,
  "link" TEXT,
  "position" INTEGER DEFAULT 0,
  "status" TEXT DEFAULT 'active'::text,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."build_logs"
CREATE TABLE IF NOT EXISTS public."build_logs" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "status" TEXT NOT NULL,
  "commit_message" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."carts"
CREATE TABLE IF NOT EXISTS public."carts" (
  "session_id" TEXT NOT NULL,
  "items" JSONB DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("session_id")
);

-- Table: public."categories"
CREATE TABLE IF NOT EXISTS public."categories" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "image" TEXT,
  "parent_id" UUID,
  "status" TEXT DEFAULT 'active'::text,
  "sort_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "icon" TEXT DEFAULT '📦'::text,
  "isFeatured" BOOLEAN DEFAULT false,
  "icon_type" TEXT DEFAULT 'emoji'::text,
  "custom_code" TEXT,
  PRIMARY KEY ("id")
);

-- Table: public."chat_messages"
CREATE TABLE IF NOT EXISTS public."chat_messages" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "session_id" UUID,
  "sender" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."chat_sessions"
CREATE TABLE IF NOT EXISTS public."chat_sessions" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "user_id" UUID,
  "session_token" TEXT NOT NULL,
  "session_type" TEXT DEFAULT 'customer'::text,
  "status" TEXT DEFAULT 'ai'::text,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."coupons"
CREATE TABLE IF NOT EXISTS public."coupons" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "code" TEXT NOT NULL,
  "discount_type" TEXT,
  "discount_value" NUMERIC NOT NULL,
  "min_order_amount" NUMERIC,
  "max_discount_amount" NUMERIC,
  "usage_limit" INTEGER,
  "used_count" INTEGER DEFAULT 0,
  "user_usage_limit" INTEGER DEFAULT 1,
  "start_date" TIMESTAMP WITHOUT TIME ZONE,
  "end_date" TIMESTAMP WITHOUT TIME ZONE,
  "status" TEXT DEFAULT 'active'::text,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."marketing_campaigns"
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

-- Table: public."messages"
CREATE TABLE IF NOT EXISTS public."messages" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "sender_id" UUID,
  "receiver_id" UUID,
  "content" TEXT NOT NULL,
  "is_read" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."notifications"
CREATE TABLE IF NOT EXISTS public."notifications" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "sender_id" UUID,
  "recipient_id" UUID,
  "recipient_type" NOTIFICATION_RECIPIENT_TYPE NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" NOTIFICATION_TYPE DEFAULT 'info'::notification_type NOT NULL,
  "is_read" BOOLEAN DEFAULT false NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."orders"
CREATE TABLE IF NOT EXISTS public."orders" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "user_id" UUID,
  "order_number" TEXT NOT NULL,
  "items" JSONB DEFAULT '[]'::jsonb NOT NULL,
  "subtotal" NUMERIC NOT NULL,
  "shipping_cost" NUMERIC DEFAULT 0,
  "tax" NUMERIC DEFAULT 0,
  "total" NUMERIC NOT NULL,
  "status" TEXT DEFAULT 'pending'::text,
  "payment_method" TEXT,
  "payment_status" TEXT DEFAULT 'unpaid'::text,
  "shipping_address" JSONB,
  "billing_address" JSONB,
  "notes" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "coupon_code" TEXT,
  "discount" NUMERIC DEFAULT 0,
  PRIMARY KEY ("id")
);

-- Table: public."page_logs"
CREATE TABLE IF NOT EXISTS public."page_logs" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "route_path" TEXT NOT NULL,
  "error_code" INTEGER NOT NULL,
  "user_ip" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."page_views"
CREATE TABLE IF NOT EXISTS public."page_views" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "visitor_id" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "browser" TEXT,
  "os" TEXT,
  "device_type" TEXT,
  "country" TEXT,
  "referer" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "event_type" TEXT DEFAULT 'page_view'::text,
  "user_id" UUID,
  "session_id" TEXT,
  "referrer" TEXT,
  PRIMARY KEY ("id")
);

-- Table: public."product_questions"
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
  "status" TEXT DEFAULT 'pending'::text,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."product_reviews"
CREATE TABLE IF NOT EXISTS public."product_reviews" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "product_id" TEXT NOT NULL,
  "user_id" TEXT,
  "customer_name" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "images" JSONB DEFAULT '[]'::jsonb,
  "verified_purchase" BOOLEAN DEFAULT false,
  "status" TEXT DEFAULT 'approved'::text,
  "helpful_count" INTEGER DEFAULT 0,
  "admin_reply" TEXT,
  "admin_reply_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."products"
CREATE TABLE IF NOT EXISTS public."products" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "price" NUMERIC NOT NULL,
  "original_price" NUMERIC,
  "category" TEXT,
  "category_slug" TEXT,
  "images" JSONB DEFAULT '[]'::jsonb,
  "stock" INTEGER DEFAULT 0,
  "sku" TEXT,
  "vendor_id" UUID,
  "status" TEXT DEFAULT 'active'::text,
  "featured" BOOLEAN DEFAULT false,
  "tags" JSONB DEFAULT '[]'::jsonb,
  "rating" NUMERIC DEFAULT 0,
  "review_count" INTEGER DEFAULT 0,
  "sold_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "brand" TEXT,
  "nameBn" TEXT,
  "descriptionBn" TEXT,
  "isNewArrival" BOOLEAN DEFAULT false,
  "isBestSeller" BOOLEAN DEFAULT false,
  "discountPercent" INTEGER,
  "regularPrice" NUMERIC DEFAULT 0,
  "sellingPrice" NUMERIC DEFAULT 0,
  "oldPrice" NUMERIC DEFAULT 0,
  "stockQuantity" INTEGER DEFAULT 0,
  "stockStatus" TEXT DEFAULT 'in_stock'::text,
  "featuredImage" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "isFeatured" BOOLEAN DEFAULT false,
  "sizes" JSONB DEFAULT '[]'::jsonb,
  "colors" JSONB DEFAULT '[]'::jsonb,
  "shortDescription" TEXT,
  "fts" TSVECTOR,
  "approval_status" TEXT DEFAULT 'approved'::text,
  "attributes" JSONB DEFAULT '[]'::jsonb,
  "variants" JSONB DEFAULT '[]'::jsonb,
  "embedding" VECTOR,
  PRIMARY KEY ("id")
);

-- Table: public."settings"
CREATE TABLE IF NOT EXISTS public."settings" (
  "id" UUID DEFAULT gen_random_uuid() NOT NULL,
  "site_name" TEXT DEFAULT 'StellarMart BD'::text,
  "site_tagline" TEXT DEFAULT 'Your Premium E-commerce Partner'::text,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "logo_url" TEXT,
  "facebook_url" TEXT,
  "instagram_url" TEXT,
  "youtube_url" TEXT,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."users"
CREATE TABLE IF NOT EXISTS public."users" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "phone" TEXT,
  "avatar" TEXT,
  "role" TEXT DEFAULT 'customer'::text,
  "status" TEXT DEFAULT 'active'::text,
  "last_login" TIMESTAMP WITHOUT TIME ZONE,
  "address" JSONB,
  "reset_password_token" TEXT,
  "reset_password_expire" TIMESTAMP WITHOUT TIME ZONE,
  "email_verified" BOOLEAN DEFAULT false,
  "email_verification_token" TEXT,
  "email_verification_expire" TIMESTAMP WITHOUT TIME ZONE,
  "login_attempts" INTEGER DEFAULT 0,
  "last_failed_login" TIMESTAMP WITHOUT TIME ZONE,
  "otp_attempts" INTEGER DEFAULT 0,
  "last_otp_request" TIMESTAMP WITHOUT TIME ZONE,
  "wishlist" JSONB DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Table: public."vendor_orders"
CREATE TABLE IF NOT EXISTS public."vendor_orders" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "vendor_id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "items" JSONB DEFAULT '[]'::jsonb NOT NULL,
  "vendor_status" TEXT DEFAULT 'pending'::text NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "total_amount" NUMERIC DEFAULT 0,
  PRIMARY KEY ("id")
);

-- Table: public."vendor_products"
CREATE TABLE IF NOT EXISTS public."vendor_products" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "vendor_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "name_bn" TEXT DEFAULT ''::text,
  "slug" TEXT,
  "description" TEXT DEFAULT ''::text,
  "description_bn" TEXT DEFAULT ''::text,
  "short_description" TEXT DEFAULT ''::text,
  "brand" TEXT DEFAULT ''::text,
  "price" NUMERIC NOT NULL,
  "original_price" NUMERIC,
  "sku" TEXT DEFAULT ''::text,
  "stock" INTEGER DEFAULT 0,
  "category" TEXT DEFAULT ''::text,
  "images" JSONB DEFAULT '[]'::jsonb,
  "featured_image" TEXT DEFAULT ''::text,
  "tags" JSONB DEFAULT '[]'::jsonb,
  "is_featured" BOOLEAN DEFAULT false,
  "is_new_arrival" BOOLEAN DEFAULT false,
  "is_best_seller" BOOLEAN DEFAULT false,
  "is_active" BOOLEAN DEFAULT true,
  "status" TEXT DEFAULT 'active'::text,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "approval_status" CHARACTER VARYING DEFAULT 'pending'::character varying,
  PRIMARY KEY ("id")
);

-- Table: public."vendors"
CREATE TABLE IF NOT EXISTS public."vendors" (
  "id" UUID DEFAULT uuid_generate_v4() NOT NULL,
  "user_id" UUID,
  "username" TEXT,
  "shop_name" TEXT NOT NULL,
  "owner_name" TEXT NOT NULL,
  "shop_address" TEXT,
  "logo_url" TEXT,
  "status" TEXT DEFAULT 'active'::text,
  "is_verified" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "password" TEXT,
  "email" TEXT,
  "phone" NUMERIC,
  "verification_badge" BOOLEAN,
  "description" TEXT,
  PRIMARY KEY ("id")
);

-- Utility RPC for schema and migrations
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE 'SELECT json_agg(t) FROM (' || query || ') t' INTO result;
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO postgres;


-- ==============================================================================
-- SKU SYSTEM TABLES & PROCEDURES
-- ==============================================================================
-- ==============================================================================
-- STELLARMARTBD: SKU SYSTEM MIGRATION SCRIPT
-- ==============================================================================
-- IMPORTANT SAFETY NOTICE:
-- Please create a full backup of your Supabase database before executing migrations.
-- ==============================================================================

-- 1. SKU CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.sku_categories (
    code VARCHAR(2) PRIMARY KEY,
    name TEXT NOT NULL,
    group_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_serial INT NOT NULL DEFAULT 0
);

-- 2. SIZES TABLE
CREATE TABLE IF NOT EXISTS public.sizes (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- 3. COLORS TABLE
CREATE TABLE IF NOT EXISTS public.colors (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hex TEXT
);

-- 4. SKU REGISTRY TABLE
-- Central immutable ledger of every generated SKU (both product-level and variant-level)
-- Guarantees uniqueness, auditability, and prevents reuse even after product soft-delete.
CREATE TABLE IF NOT EXISTS public.sku_registry (
    sku TEXT PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_key TEXT,
    category_code VARCHAR(2) NOT NULL REFERENCES public.sku_categories(code),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sku_registry_product_id ON public.sku_registry(product_id);
CREATE INDEX IF NOT EXISTS idx_sku_registry_category_code ON public.sku_registry(category_code);

-- 5. ALTER CATEGORIES & PRODUCTS TABLES
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS sku_category_code VARCHAR(2) REFERENCES public.sku_categories(code);

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS legacy_sku TEXT,
ADD COLUMN IF NOT EXISTS category_code VARCHAR(2) REFERENCES public.sku_categories(code),
ADD COLUMN IF NOT EXISTS size_code TEXT,
ADD COLUMN IF NOT EXISTS color_code TEXT;

-- 6. SEED SKU CATEGORIES (47 Categories across 10 Groups + Reserved)
INSERT INTO public.sku_categories (code, name, group_name, is_active, last_serial) VALUES
-- Electronics (10-19)
('10', 'Mobile Phone', 'Electronics', true, 0),
('11', 'Tablet', 'Electronics', true, 0),
('12', 'Laptop', 'Electronics', true, 0),
('13', 'Desktop & Computer Parts', 'Electronics', true, 0),
('14', 'Headphone/Earbuds', 'Electronics', true, 0),
('15', 'Smart Watch/Band', 'Electronics', true, 0),
('16', 'Camera', 'Electronics', true, 0),
('17', 'Charger/Cable/Power Bank', 'Electronics', true, 0),
('18', 'Speaker/Audio', 'Electronics', true, 0),
('19', 'Other Electronics', 'Electronics', true, 0),

-- Men''s Fashion (20-27)
('20', 'T-Shirt', 'Men''s Fashion', true, 0),
('21', 'Shirt', 'Men''s Fashion', true, 0),
('22', 'Panjabi', 'Men''s Fashion', true, 0),
('23', 'Pant/Jeans', 'Men''s Fashion', true, 0),
('24', 'Hoodie/Sweater/Jacket', 'Men''s Fashion', true, 0),
('25', 'Innerwear', 'Men''s Fashion', true, 0),
('26', 'Lungi/Traditional', 'Men''s Fashion', true, 0),
('27', 'Other Men''s', 'Men''s Fashion', true, 0),

-- Women''s Fashion (30-37)
('30', 'Saree', 'Women''s Fashion', true, 0),
('31', 'Three-piece/Salwar Kameez', 'Women''s Fashion', true, 0),
('32', 'Kurti/Top', 'Women''s Fashion', true, 0),
('33', 'Hijab/Abaya/Burka', 'Women''s Fashion', true, 0),
('34', 'Western (Dress, Jeans)', 'Women''s Fashion', true, 0),
('35', 'Innerwear', 'Women''s Fashion', true, 0),
('36', 'Lehenga/Party Wear', 'Women''s Fashion', true, 0),
('37', 'Other Women''s', 'Women''s Fashion', true, 0),

-- Kids & Baby (40-44)
('40', 'Baby Clothes', 'Kids & Baby', true, 0),
('41', 'Boys Clothing', 'Kids & Baby', true, 0),
('42', 'Girls Clothing', 'Kids & Baby', true, 0),
('43', 'Toys', 'Kids & Baby', true, 0),
('44', 'Baby Care', 'Kids & Baby', true, 0),

-- Shoes & Bags (45-49)
('45', 'Men''s Shoes', 'Shoes & Bags', true, 0),
('46', 'Women''s Shoes', 'Shoes & Bags', true, 0),
('47', 'Kids'' Shoes', 'Shoes & Bags', true, 0),
('48', 'Bag', 'Shoes & Bags', true, 0),
('49', 'Wallet/Belt', 'Shoes & Bags', true, 0),

-- Beauty & Health (50-56)
('50', 'Skincare', 'Beauty & Health', true, 0),
('51', 'Makeup', 'Beauty & Health', true, 0),
('52', 'Haircare', 'Beauty & Health', true, 0),
('53', 'Perfume/Attar', 'Beauty & Health', true, 0),
('54', 'Personal Care', 'Beauty & Health', true, 0),
('55', 'Health & Supplement', 'Beauty & Health', true, 0),
('56', 'Men''s Grooming', 'Beauty & Health', true, 0),

-- Home & Kitchen (60-66)
('60', 'Kitchenware', 'Home & Kitchen', true, 0),
('61', 'Furniture', 'Home & Kitchen', true, 0),
('62', 'Bedding', 'Home & Kitchen', true, 0),
('63', 'Home Decor', 'Home & Kitchen', true, 0),
('64', 'Lighting', 'Home & Kitchen', true, 0),
('65', 'Cleaning', 'Home & Kitchen', true, 0),
('66', 'Home Appliance', 'Home & Kitchen', true, 0),

-- Food & Grocery (70-75)
('70', 'Rice/Dal/Oil', 'Food & Grocery', true, 0),
('71', 'Spices', 'Food & Grocery', true, 0),
('72', 'Snacks', 'Food & Grocery', true, 0),
('73', 'Beverages', 'Food & Grocery', true, 0),
('74', 'Dry Fruits/Honey', 'Food & Grocery', true, 0),
('75', 'Fresh/Frozen', 'Food & Grocery', true, 0),

-- Accessories (76-79)
('76', 'Watch', 'Accessories', true, 0),
('77', 'Jewellery', 'Accessories', true, 0),
('78', 'Sunglasses', 'Accessories', true, 0),
('79', 'Mobile Case/Accessories', 'Accessories', true, 0),

-- Others (80-89, 99)
('80', 'Sports & Fitness', 'Others', true, 0),
('81', 'Books', 'Others', true, 0),
('82', 'Stationery', 'Others', true, 0),
('83', 'Gaming', 'Others', true, 0),
('84', 'Bike/Car Accessories', 'Others', true, 0),
('85', 'Tools & Hardware', 'Others', true, 0),
('86', 'Pet Supplies', 'Others', true, 0),
('87', 'Musical Instruments', 'Others', true, 0),
('88', 'Gift Items', 'Others', true, 0),
('89', 'Islamic Items', 'Others', true, 0),
('99', 'Others', 'Others', true, 0)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    group_name = EXCLUDED.group_name;

-- 7. SEED SIZES
INSERT INTO public.sizes (code, name) VALUES
('00', 'No size'),
('01', 'S'),
('02', 'M'),
('03', 'L'),
('04', 'XL'),
('05', '2XL'),
('06', '3XL'),
('07', '4XL'),
('99', 'Free Size'),
('38', 'Size 38'),
('39', 'Size 39'),
('40', 'Size 40'),
('41', 'Size 41'),
('42', 'Size 42'),
('43', 'Size 43'),
('44', 'Size 44'),
('45', 'Size 45')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name;

-- 8. SEED COLORS
INSERT INTO public.colors (code, name, hex) VALUES
('01', 'Black', '#000000'),
('02', 'White', '#FFFFFF'),
('03', 'Red', '#EF4444'),
('04', 'Blue', '#3B82F6'),
('05', 'Green', '#10B981'),
('06', 'Yellow', '#FACC15'),
('07', 'Grey', '#6B7280'),
('08', 'Brown', '#78350F'),
('09', 'Navy', '#1E3A8A'),
('10', 'Olive', '#84CC16'),
('11', 'Pink', '#EC4899'),
('12', 'Orange', '#F97316'),
('13', 'Purple', '#A855F7'),
('14', 'Maroon', '#831843'),
('15', 'Beige', '#F5F5DC'),
('16', 'Gold', '#D97706'),
('17', 'Silver', '#94A3B8'),
('18', 'Multicolor', 'linear-gradient(135deg, #EF4444 0%, #3B82F6 50%, #10B981 100%)'),
('99', 'Other', '#9CA3AF')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    hex = EXCLUDED.hex;

-- ==============================================================================
-- 9. ATOMIC SERVER-SIDE SKU GENERATOR FUNCTION
-- ==============================================================================
-- Concurrency safe: Uses atomic UPDATE ... SET last_serial = last_serial + count RETURNING
-- Row-level locking on sku_categories guarantees two vendors never get the same serial.
-- Automatically formats to 4 digits (0001), expands to 5+ digits past 9999.
-- Atomically registers each SKU in sku_registry.
-- SECURITY DEFINER ensures vendors cannot bypass serial numbering.
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
        RAISE EXCEPTION 'Category code % does not exist', p_category_code;
    END IF;

    IF NOT v_cat_exists THEN
        RAISE EXCEPTION 'Category code % is inactive', p_category_code;
    END IF;

    -- Atomically lock the category row and increment counter by p_count
    UPDATE public.sku_categories
    SET last_serial = last_serial + p_count
    WHERE code = p_category_code
    RETURNING last_serial INTO v_end_serial;

    v_start_serial := v_end_serial - p_count + 1;

    -- Loop to generate and register each SKU
    FOR v_curr_serial IN v_start_serial..v_end_serial LOOP
        IF v_curr_serial < 10000 THEN
            v_serial_str := LPAD(v_curr_serial::TEXT, 4, '0');
        ELSE
            v_serial_str := v_curr_serial::TEXT;
        END IF;

        v_sku := 'SMBD' || p_category_code || v_serial_str;

        -- Extract variant key if provided
        v_var_key := NULL;
        IF p_variant_keys IS NOT NULL AND array_length(p_variant_keys, 1) >= v_idx THEN
            v_var_key := p_variant_keys[v_idx];
        END IF;

        -- Atomically register in sku_registry
        INSERT INTO public.sku_registry (sku, product_id, variant_key, category_code, created_at)
        VALUES (v_sku, p_product_id, v_var_key, p_category_code, NOW());

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

-- Restrict execution to authenticated users and service_role
REVOKE ALL ON FUNCTION public.generate_next_skus(TEXT, INT, UUID, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_next_skus(TEXT, INT, UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_next_skus(TEXT, INT, UUID, TEXT[]) TO service_role;

-- ==============================================================================
-- 10. SKU DECODER FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.decode_sku(p_sku TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean TEXT := UPPER(TRIM(p_sku));
    v_cat_code TEXT;
    v_serial_str TEXT;
    v_cat_name TEXT;
    v_group_name TEXT;
    v_registry_row RECORD;
BEGIN
    IF v_clean !~ '^SMBD[0-9]{6,}$' THEN
        RETURN jsonb_build_object('valid', false, 'error', 'Invalid SKU format. Expected ^SMBD\d{6,}$');
    END IF;

    v_cat_code := SUBSTRING(v_clean FROM 5 FOR 2);
    v_serial_str := SUBSTRING(v_clean FROM 7);

    SELECT name, group_name INTO v_cat_name, v_group_name
    FROM public.sku_categories
    WHERE code = v_cat_code;

    -- Also check sku_registry for quick attribution
    SELECT product_id, variant_key, created_at INTO v_registry_row
    FROM public.sku_registry
    WHERE sku = v_clean;

    RETURN jsonb_build_object(
        'valid', true,
        'sku', v_clean,
        'category_code', v_cat_code,
        'category_name', COALESCE(v_cat_name, 'Unknown'),
        'group_name', COALESCE(v_group_name, 'Unknown'),
        'serial', v_serial_str::BIGINT,
        'serial_str', v_serial_str,
        'registered', v_registry_row.product_id IS NOT NULL,
        'product_id', v_registry_row.product_id,
        'variant_key', v_registry_row.variant_key,
        'registered_at', v_registry_row.created_at
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.decode_sku(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decode_sku(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.decode_sku(TEXT) TO anon;

-- ==============================================================================
-- 11. IMMUTABILITY TRIGGER FUNCTION (To be activated after data migration)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.prevent_sku_and_variant_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_var JSONB;
    v_new_var JSONB;
    v_old_sku TEXT;
    v_found BOOLEAN;
BEGIN
    -- 1. Disallow changing product-level SKU once set
    IF OLD.sku IS NOT NULL AND NEW.sku IS DISTINCT FROM OLD.sku THEN
        RAISE EXCEPTION 'Product SKU is immutable and cannot be changed once set (Existing: %, Attempted: %)', OLD.sku, NEW.sku;
    END IF;

    -- 2. Lock category once product SKU is set (so editing product does not alter category_code or SKU)
    IF OLD.sku IS NOT NULL AND OLD.category_code IS NOT NULL AND NEW.category_code IS DISTINCT FROM OLD.category_code THEN
        RAISE EXCEPTION 'Product category code is locked once SKU is assigned (Assigned: %, Attempted: %)', OLD.category_code, NEW.category_code;
    END IF;

    -- 3. Disallow changing or removing existing variant SKUs inside JSONB variants
    IF OLD.variants IS NOT NULL AND jsonb_typeof(OLD.variants) = 'array' AND jsonb_array_length(OLD.variants) > 0 THEN
        FOR v_old_var IN SELECT * FROM jsonb_array_elements(OLD.variants) LOOP
            v_old_sku := v_old_var->>'sku';
            IF v_old_sku IS NOT NULL AND v_old_sku <> '' THEN
                -- Must exist unchanged in NEW.variants
                v_found := false;
                IF NEW.variants IS NOT NULL AND jsonb_typeof(NEW.variants) = 'array' THEN
                    FOR v_new_var IN SELECT * FROM jsonb_array_elements(NEW.variants) LOOP
                        IF v_new_var->>'sku' = v_old_sku THEN
                            v_found := true;
                            EXIT;
                        END IF;
                    END LOOP;
                END IF;

                IF NOT v_found THEN
                    RAISE EXCEPTION 'Variant SKU % is immutable and cannot be deleted or changed', v_old_sku;
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- ==============================================================================
-- 12. MAP STOREFRONT CATEGORIES TO SKU CATEGORY CODES
-- ==============================================================================
UPDATE public.categories SET sku_category_code = '14' WHERE name ILIKE '%Earphone%' OR name ILIKE '%Earbud%' OR name ILIKE '%IEM%' OR name ILIKE '%Headphone%';
UPDATE public.categories SET sku_category_code = '77' WHERE name ILIKE '%Churi%' OR name ILIKE '%Jewel%' OR name ILIKE '%Bangle%';
UPDATE public.categories SET sku_category_code = '64' WHERE name ILIKE '%RGB Light%' OR name ILIKE '%Light%';
UPDATE public.categories SET sku_category_code = '83' WHERE name ILIKE '%Finger Sleeve%' OR name ILIKE '%Gaming%';
UPDATE public.categories SET sku_category_code = '24' WHERE name ILIKE '%Hood%' OR name ILIKE '%Sweater%' OR name ILIKE '%Jacket%';
UPDATE public.categories SET sku_category_code = '13' WHERE name ILIKE '%Development Board%' OR name ILIKE '%Computer%';
UPDATE public.categories SET sku_category_code = '79' WHERE name ILIKE '%Mobile Cooler%' OR name ILIKE '%Case%';
UPDATE public.categories SET sku_category_code = '80' WHERE name ILIKE '%Football%' OR name ILIKE '%Jersey%';
UPDATE public.categories SET sku_category_code = '10' WHERE name ILIKE '%Mobile Phone%';
UPDATE public.categories SET sku_category_code = '20' WHERE name ILIKE '%T-Shirt%';
UPDATE public.categories SET sku_category_code = '21' WHERE name ILIKE '%Shirt%' AND name NOT ILIKE '%T-Shirt%';
UPDATE public.categories SET sku_category_code = '22' WHERE name ILIKE '%Panjabi%';
UPDATE public.categories SET sku_category_code = '23' WHERE name ILIKE '%Pant%' OR name ILIKE '%Jeans%';
UPDATE public.categories SET sku_category_code = '30' WHERE name ILIKE '%Saree%';
UPDATE public.categories SET sku_category_code = '50' WHERE name ILIKE '%Skincare%';
UPDATE public.categories SET sku_category_code = '52' WHERE name ILIKE '%Hair%';
UPDATE public.categories SET sku_category_code = '61' WHERE name ILIKE '%Furniture%';
UPDATE public.categories SET sku_category_code = '60' WHERE name ILIKE '%Kitchen%';

-- ==============================================================================
-- 13. POST-MIGRATION TRIGGER ACTIVATION & UNIQUE CONSTRAINT
-- (Execute AFTER running scripts/migrate_existing_skus.js on existing products)
-- ==============================================================================
-- DROP TRIGGER IF EXISTS trg_prevent_sku_and_variant_tampering ON public.products;
-- CREATE TRIGGER trg_prevent_sku_and_variant_tampering
-- BEFORE UPDATE ON public.products
-- FOR EACH ROW
-- EXECUTE FUNCTION public.prevent_sku_and_variant_tampering();
--
-- ALTER TABLE public.products ADD CONSTRAINT products_sku_unique UNIQUE (sku);


