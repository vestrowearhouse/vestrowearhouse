-- ==============================================================================
-- DATABASE EXPLORER SECURE RPC MIGRATION
-- ==============================================================================

-- 1. Function: get_public_tables()
-- Safely lists all public base tables and their exact current row counts.
CREATE OR REPLACE FUNCTION public.get_public_tables()
RETURNS TABLE (
  name text,
  total_rows bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec record;
  row_count bigint;
BEGIN
  FOR rec IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    name := rec.table_name;
    EXECUTE format('SELECT count(*) FROM public.%I', name) INTO row_count;
    total_rows := row_count;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Revoke public execution & restrict to service_role only
REVOKE EXECUTE ON FUNCTION public.get_public_tables() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_tables() TO service_role;


-- 2. Function: get_table_schema(target_table_name text)
-- Returns column definitions, nullability, and primary key constraints.
DROP FUNCTION IF EXISTS public.get_table_schema(text);
CREATE OR REPLACE FUNCTION public.get_table_schema(target_table_name text)
RETURNS TABLE (
  name text, 
  type text, 
  is_nullable boolean, 
  default_value text,
  is_primary_key boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.column_name::text as name, 
    c.data_type::text as type, 
    (c.is_nullable = 'YES') as is_nullable, 
    c.column_default::text as default_value,
    COALESCE((
      SELECT true
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.table_constraints tc 
        ON kcu.constraint_name = tc.constraint_name 
      WHERE kcu.table_name = c.table_name 
        AND kcu.column_name = c.column_name 
        AND tc.constraint_type = 'PRIMARY KEY'
    ), false) as is_primary_key
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
    AND c.table_name = target_table_name
  ORDER BY c.ordinal_position;
$$;

-- Revoke public execution & restrict to service_role only
REVOKE EXECUTE ON FUNCTION public.get_table_schema(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_schema(text) TO service_role;


-- 3. Function: get_database_size()
-- Returns the actual PostgreSQL database size in bytes directly from disk storage.
CREATE OR REPLACE FUNCTION public.get_database_size()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pg_database_size(current_database());
$$;

-- Revoke public execution & restrict to service_role only
REVOKE EXECUTE ON FUNCTION public.get_database_size() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_database_size() TO service_role;
