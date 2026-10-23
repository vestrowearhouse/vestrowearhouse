-- Run this query in your Supabase SQL Editor

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS icon_type TEXT DEFAULT 'emoji',
ADD COLUMN IF NOT EXISTS custom_code TEXT;

-- Verify the columns were added
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'categories';
