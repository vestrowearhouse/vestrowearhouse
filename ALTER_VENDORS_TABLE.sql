-- Run this in your Supabase SQL Editor to add the description column to vendors table
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS description TEXT;
