import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nzjspqceuthqdumvsdos.supabase.co';
const supabaseKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  'sb_publishable_Rv9EC7x1-VNmP2NzxfZSDw_pQECny4g';

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
