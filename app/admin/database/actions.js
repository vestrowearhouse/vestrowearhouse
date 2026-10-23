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

export async function executeSql(sql) {
  if (!supabase) return { success: false, error: 'Supabase credentials missing in environment variables.' };
  
  try {
    // Supabase JS client doesn't run raw SQL directly without an RPC function
    const { data, error } = await supabase.rpc('exec_sql', { query_sql: sql });
    
    if (error) {
      // If the RPC function is missing, we send the exact SQL they need to run in their Supabase Dashboard to enable this feature
      if (error.code === 'PGRST202' || error.message.includes('find')) {
        return { success: false, error: "To run raw SQL from this admin panel, you must enable the 'exec_sql' RPC function first.\n\nPlease go to your Supabase Dashboard -> SQL Editor and run this exact command once:\n\nCREATE OR REPLACE FUNCTION exec_sql(query_sql text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE result jsonb; BEGIN IF query_sql ILIKE 'SELECT%' THEN EXECUTE 'SELECT json_agg(row) FROM (' || query_sql || ') row' INTO result; RETURN result; ELSE EXECUTE query_sql; RETURN '{\"status\": \"success\"}'::jsonb; END IF; EXCEPTION WHEN OTHERS THEN RETURN json_build_object('error', SQLERRM)::jsonb; END; $$;" };
      }
      throw error;
    }
    return { success: true, data: data || { status: 'Executed successfully' } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}