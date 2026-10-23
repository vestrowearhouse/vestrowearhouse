-- ============================================================================
-- Supabase Database Management RPC Functions
-- Run these queries in your Supabase SQL Editor
-- ============================================================================

-- 1. Execute SQL Function - for running raw SQL queries
CREATE OR REPLACE FUNCTION exec_sql(query_sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- For SELECT queries
  IF query_sql ILIKE 'SELECT%' THEN
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query_sql || ') t' INTO result;
    RETURN COALESCE(result, '[]'::jsonb);
  
  -- For other queries (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP)
  ELSE
    EXECUTE query_sql;
    RETURN '{"status": "success"}'::jsonb;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM, 'detail', SQLSTATE)::jsonb;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- ============================================================================

-- 2. Get Tables Function - fetch all tables with metadata
CREATE OR REPLACE FUNCTION get_tables()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT json_agg(
    json_build_object(
      'name', tablename,
      'rowCount', 0,
      'createdAt', now()::text
    )
  ) INTO result
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
  
  RETURN COALESCE(result, '[]'::jsonb);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM)::jsonb;
END;
$$;

GRANT EXECUTE ON FUNCTION get_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tables() TO service_role;

-- ============================================================================

-- 3. Get Table Schema Function - fetch column information
CREATE OR REPLACE FUNCTION get_table_schema(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT json_agg(
    json_build_object(
      'name', column_name,
      'type', data_type,
      'nullable', is_nullable = 'YES',
      'defaultValue', column_default,
      'primaryKey', constraint_type = 'PRIMARY KEY',
      'unique', constraint_type = 'UNIQUE'
    ) ORDER BY ordinal_position
  ) INTO result
  FROM (
    SELECT 
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      c.ordinal_position,
      tc.constraint_type
    FROM information_schema.columns c
    LEFT JOIN information_schema.key_column_usage kcu
      ON c.table_name = kcu.table_name 
      AND c.column_name = kcu.column_name
      AND c.table_schema = kcu.table_schema
    LEFT JOIN information_schema.table_constraints tc
      ON kcu.constraint_name = tc.constraint_name
      AND tc.table_schema = c.table_schema
    WHERE c.table_name = $1 
      AND c.table_schema = 'public'
    ORDER BY c.ordinal_position
  ) schema_info;
  
  RETURN COALESCE(result, '[]'::jsonb);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM)::jsonb;
END;
$$;

GRANT EXECUTE ON FUNCTION get_table_schema(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_schema(text) TO service_role;

-- ============================================================================

-- 4. Get Database Stats Function - fetch database metrics
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT json_build_object(
    'status', 'connected',
    'totalTables', (
      SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'
    ),
    'totalSize', pg_database_size(current_database()),
    'timestamp', now()::text
  ) INTO result;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM)::jsonb;
END;
$$;

GRANT EXECUTE ON FUNCTION get_database_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_database_stats() TO service_role;

-- ============================================================================

-- Verify all functions are created
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('exec_sql', 'get_tables', 'get_table_schema', 'get_database_stats')
ORDER BY routine_name;
