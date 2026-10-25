'use server';

import { createClient } from '@supabase/supabase-js';

// Using the Service Role key to bypass RLS and allow raw database management
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function fetchTableData(tableName) {
  if (!supabase) return { success: false, error: 'Supabase credentials missing in environment variables.' };
  
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(100);
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function executeSql() {
  return { 
    success: false, 
    error: 'Raw SQL execution from the web admin panel has been permanently disabled for security reasons.' 
  };
}