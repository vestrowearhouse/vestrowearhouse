-- Run this query in your Supabase SQL Editor

-- 1. DROP the old conflicting table (so we can start fresh without the 'key' column error)
DROP TABLE IF EXISTS public.settings;

-- 2. Create the new correct table
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name TEXT DEFAULT 'StellarMart BD',
    site_tagline TEXT DEFAULT 'Your Premium E-commerce Partner',
    email TEXT,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    youtube_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert the default row
INSERT INTO public.settings (site_name, email, phone, address)
VALUES ('StellarMart BD', 'support@stellarmartbd.com', '+880 1234 567890', 'Dhaka, Bangladesh');
