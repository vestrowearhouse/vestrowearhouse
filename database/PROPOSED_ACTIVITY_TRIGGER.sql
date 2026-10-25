-- =============================================================================
-- PROPOSED SECURE ACTIVITY LOG TRIGGER REPLACEMENT
-- Stellar Mart BD Security Hardening
-- 
-- IMPORTANT:
-- Run this manually inside the Supabase SQL Editor.
-- The AI assistant will NOT execute this script automatically.
--
-- FIXES:
-- 1. Drops trigger on `public.users` completely so passwords, hashes, tokens,
--    and OTPs are never copied into public.activity_logs.
-- 2. On UPDATE (orders/products): Stores ONLY the changed columns with { old, new },
--    never the entire raw row.
-- 3. Strips sensitive keys automatically (password, hash, secret, token, otp).
-- =============================================================================

-- 1. Drop the dangerous trigger on users table completely
DROP TRIGGER IF EXISTS log_users_activity ON public.users;

-- 2. Secure trigger function that computes clean JSON diffs without sensitive data
CREATE OR REPLACE FUNCTION secure_log_activity_function()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields JSONB := '{}'::jsonb;
    old_row JSONB;
    new_row JSONB;
    key TEXT;
    sensitive_keys TEXT[] := ARRAY['password', 'password_hash', 'hash', 'token', 'access_token', 'refresh_token', 'otp', 'secret', 'secret_key', 'api_key'];
BEGIN
    -- ── UPDATE ───────────────────────────────────────────────────────────────
    IF (TG_OP = 'UPDATE') THEN
        old_row := to_jsonb(OLD);
        new_row := to_jsonb(NEW);

        -- Iterate over all keys in the new row and compare with old row
        FOR key IN SELECT jsonb_object_keys(new_row)
        LOOP
            -- Skip sensitive keys
            IF key = ANY(sensitive_keys) THEN
                CONTINUE;
            END IF;

            -- If value changed, record { old, new }
            IF (old_row -> key) IS DISTINCT FROM (new_row -> key) THEN
                changed_fields := jsonb_set(
                    changed_fields,
                    ARRAY[key],
                    jsonb_build_object('old', old_row -> key, 'new', new_row -> key)
                );
            END IF;
        END LOOP;

        -- Only log if actual non-sensitive columns changed
        IF changed_fields <> '{}'::jsonb THEN
            INSERT INTO public.activity_logs (table_name, action_type, record_id, details)
            VALUES (
                TG_TABLE_NAME,
                TG_OP,
                NEW.id::text,
                jsonb_build_object(
                    'changes', changed_fields,
                    'actor', COALESCE(current_setting('request.jwt.claim.email', true), 'System/Admin')
                )
            );
        END IF;

        RETURN NEW;

    -- ── INSERT ───────────────────────────────────────────────────────────────
    ELSIF (TG_OP = 'INSERT') THEN
        new_row := to_jsonb(NEW);

        -- Remove any sensitive keys if accidentally present
        FOREACH key IN ARRAY sensitive_keys
        LOOP
            new_row := new_row - key;
        END LOOP;

        INSERT INTO public.activity_logs (table_name, action_type, record_id, details)
        VALUES (
            TG_TABLE_NAME,
            TG_OP,
            NEW.id::text,
            new_row
        );

        RETURN NEW;

    -- ── DELETE ───────────────────────────────────────────────────────────────
    ELSIF (TG_OP = 'DELETE') THEN
        old_row := to_jsonb(OLD);

        -- Remove any sensitive keys
        FOREACH key IN ARRAY sensitive_keys
        LOOP
            old_row := old_row - key;
        END LOOP;

        INSERT INTO public.activity_logs (table_name, action_type, record_id, details)
        VALUES (
            TG_TABLE_NAME,
            TG_OP,
            OLD.id::text,
            old_row
        );

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Attach secure trigger ONLY to products and orders (NEVER users)
DO $$
BEGIN
    -- Products Trigger
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
        DROP TRIGGER IF EXISTS log_products_activity ON public.products;
        CREATE TRIGGER log_products_activity
        AFTER INSERT OR UPDATE OR DELETE ON public.products
        FOR EACH ROW EXECUTE FUNCTION secure_log_activity_function();
    END IF;

    -- Orders Trigger
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        DROP TRIGGER IF EXISTS log_orders_activity ON public.orders;
        CREATE TRIGGER log_orders_activity
        AFTER INSERT OR UPDATE OR DELETE ON public.orders
        FOR EACH ROW EXECUTE FUNCTION secure_log_activity_function();
    END IF;
END $$;
