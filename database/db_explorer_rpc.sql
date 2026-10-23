-- STATEMENT
CREATE OR REPLACE FUNCTION get_public_tables()
RETURNS TABLE (
  name text,
  total_rows bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- STATEMENT
DROP FUNCTION IF EXISTS get_table_schema(text);
CREATE OR REPLACE FUNCTION get_table_schema(target_table_name text)
RETURNS TABLE (
  name text, 
  type text, 
  is_nullable boolean, 
  default_value text,
  is_primary_key boolean
)
LANGUAGE sql
SECURITY DEFINER
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

-- STATEMENT
-- Allow raw execution (WARNING: SECURITY DEFINER with raw EXECUTE is dangerous. Since this is restricted to service_role in Next.js backend, we accept the risk. For production, restrict this heavily!)
DROP FUNCTION IF EXISTS exec_sql(text);
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Simple execution, doesn't handle all result types well but good for demo
  EXECUTE format('SELECT json_agg(t) FROM (%s) t', query) INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM)::jsonb;
END;
$$;
