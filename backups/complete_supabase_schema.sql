-- ==============================================================================
-- STELLARMARTBD: AUTOMATICALLY EXTRACTED POSTGRESQL SCHEMA
-- Extracted from: https://vgdejacoshvwpvbdpiqf.supabase.co
-- Date: 2026-11-03T13:11:25.291Z
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

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
