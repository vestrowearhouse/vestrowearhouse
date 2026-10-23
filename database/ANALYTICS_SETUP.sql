-- ANALYTICS_SETUP.sql
-- Run this in your Supabase SQL Editor to set up the Custom Web Analytics System

-- 1. Create page_views table
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT NOT NULL, -- To track unique visitors (usually a hashed cookie or IP)
    path TEXT NOT NULL, -- The route visited e.g. '/' or '/shop'
    browser TEXT, -- Chrome, Safari, etc
    os TEXT, -- Windows, macOS, Android, iOS
    device_type TEXT, -- mobile, tablet, desktop
    country TEXT, -- From Vercel headers if available
    referer TEXT, -- Where they came from
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for faster querying by date and path
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);

-- 3. Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy (Only service role or authenticated admin can view, anyone can insert via anon key if exposed, but we will use service role to insert from backend)
-- No explicit policies needed if we only insert/select using the Supabase Service Role key from our Next.js API routes.
