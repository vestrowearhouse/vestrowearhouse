-- 1. Create Build Logs Table
CREATE TABLE IF NOT EXISTS public.build_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL,
    commit_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Page Logs Table
CREATE TABLE IF NOT EXISTS public.page_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_path TEXT NOT NULL,
    error_code INTEGER NOT NULL,
    user_ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    record_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Optional depending on how you read it, for admin we might bypass it, but good practice)
ALTER TABLE public.build_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies (Only authenticated users with admin role, or we can just allow all authenticated for simplicity if it's internal)
-- CREATE POLICY "Allow admin to view build logs" ON public.build_logs FOR SELECT USING (auth.role() = 'authenticated');
-- (Skipping explicit policies to avoid locking out the developer, as Supabase Service Role key bypasses RLS anyway)

-- 4. Enable Supabase Realtime for build_logs and activity_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'build_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.build_logs;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'activity_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
    END IF;
END $$;


-- 5. RPC Function: get_db_stats
CREATE OR REPLACE FUNCTION get_db_stats()
RETURNS TABLE (
    table_name text,
    total_rows bigint,
    total_size bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        relname::text as table_name,
        n_live_tup as total_rows,
        pg_total_relation_size(relid) as total_size
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Trigger Function for Activity Logs
CREATE OR REPLACE FUNCTION log_activity_function()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.activity_logs (table_name, action_type, record_id, details)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.id::text, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.activity_logs (table_name, action_type, record_id, details)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id::text, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.activity_logs (table_name, action_type, record_id, details)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id::text, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Triggers
DO $$
BEGIN
    -- For users table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS log_users_activity ON public.users;
        CREATE TRIGGER log_users_activity
        AFTER INSERT OR UPDATE OR DELETE ON public.users
        FOR EACH ROW EXECUTE FUNCTION log_activity_function();
    END IF;

    -- For products table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        DROP TRIGGER IF EXISTS log_products_activity ON public.products;
        CREATE TRIGGER log_products_activity
        AFTER INSERT OR UPDATE OR DELETE ON public.products
        FOR EACH ROW EXECUTE FUNCTION log_activity_function();
    END IF;

    -- For orders table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        DROP TRIGGER IF EXISTS log_orders_activity ON public.orders;
        CREATE TRIGGER log_orders_activity
        AFTER INSERT OR UPDATE OR DELETE ON public.orders
        FOR EACH ROW EXECUTE FUNCTION log_activity_function();
    END IF;
END $$;
