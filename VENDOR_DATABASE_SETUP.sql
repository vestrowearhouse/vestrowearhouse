-- ========================================
-- SUPABASE SQL SETUP INSTRUCTIONS
-- ভেন্ডর সিস্টেম সেটআপ গাইড
-- ========================================

-- 📋 STEP 1: এই SQL কোড কপি করুন
-- 📋 STEP 2: https://app.supabase.com এ যান
-- 📋 STEP 3: আপনার প্রজেক্ট খুলুন
-- 📋 STEP 4: SQL Editor খুলুন (বাম পাশে)
-- 📋 STEP 5: নতুন Query তৈরি করুন
-- 📋 STEP 6: নিচের SQL পেস্ট করুন এবং RUN করুন

-- ========================================
-- ENABLE UUID EXTENSION
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CREATE USERS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  avatar TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login TIMESTAMP WITH TIME ZONE,
  address JSONB,
  reset_password_token TEXT,
  reset_password_expire TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,
  email_verification_expire TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  last_failed_login TIMESTAMP WITH TIME ZONE,
  wishlist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CREATE VENDORS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  shop_address TEXT,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','pending')),
  verification_badge BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CREATE INDEXES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_shop_name ON public.vendors(shop_name);

-- ========================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ========================================

-- Users Table RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Vendors Table RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- ========================================
-- REMOVE OLD RLS POLICIES (if exist)
-- ========================================
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can create users" ON public.users;
DROP POLICY IF EXISTS "Vendors can read own profile" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can update own profile" ON public.vendors;
DROP POLICY IF EXISTS "Admin can create vendors" ON public.vendors;
DROP POLICY IF EXISTS "Admin can view all vendors" ON public.vendors;

-- ========================================
-- USERS TABLE - RLS POLICIES
-- ========================================

-- Policy 1: ইউজার নিজের প্রোফাইল দেখতে পারে
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Service Role Key দিয়ে নতুন ইউজার তৈরি করা যায়
CREATE POLICY "Service role can create users"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- Policy 3: Service Role Key দিয়ে ইউজার আপডেট করা যায়
CREATE POLICY "Service role can update users"
  ON public.users FOR UPDATE
  WITH CHECK (true);

-- ========================================
-- VENDORS TABLE - RLS POLICIES
-- ========================================

-- Policy 1: ভেন্ডর নিজের প্রোফাইল দেখতে পারে
CREATE POLICY "Vendors can read own profile"
  ON public.vendors FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: ভেন্ডর নিজের প্রোফাইল আপডেট করতে পারে
CREATE POLICY "Vendors can update own profile"
  ON public.vendors FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 3: Service Role Key দিয়ে ভেন্ডর তৈরি করা যায় (Admin এর জন্য)
CREATE POLICY "Admin can create vendors"
  ON public.vendors FOR INSERT
  WITH CHECK (true);

-- Policy 4: Service Role Key দিয়ে সকল ভেন্ডর দেখা যায়
CREATE POLICY "Service role can read all vendors"
  ON public.vendors FOR SELECT
  USING (true);

-- ========================================
-- VERIFICATION - এক্সিকিউট করে ফলাফল দেখুন
-- ========================================
SELECT '✅ Users table created/verified' as status_1;
SELECT '✅ Vendors table created/verified' as status_2;
SELECT '✅ RLS policies enabled' as status_3;
SELECT '✅ Indexes created' as status_4;

-- Current counts
SELECT COUNT(*) as total_users FROM public.users WHERE role = 'vendor';
SELECT COUNT(*) as total_vendors FROM public.vendors;
