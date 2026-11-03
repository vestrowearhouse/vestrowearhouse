-- ========================================================================
-- Analytics Summary RPC for StellarMart
-- Aggregates 30-day metrics directly in PostgreSQL
-- Security: SET search_path = public, REVOKE from public/anon/auth, GRANT to service_role
-- Supports excluding internal/test visitor IDs
-- ========================================================================

-- 1. Drop existing overloaded signatures to avoid parameter mismatch conflicts
DROP FUNCTION IF EXISTS public.get_analytics_summary(integer);
DROP FUNCTION IF EXISTS public.get_analytics_summary(integer, text[]);

-- 2. Create updated function with excluded_visitors array parameter
CREATE OR REPLACE FUNCTION public.get_analytics_summary(
    days_back integer DEFAULT 30,
    excluded_visitors text[] DEFAULT '{}'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
    start_ts timestamptz := now() - (days_back || ' days')::interval;
    chart_start_ts timestamptz := date_trunc('day', now() - interval '6 days');
BEGIN
    WITH
    filtered AS (
        SELECT 
            path, 
            visitor_id, 
            COALESCE(NULLIF(device_type, ''), 'desktop') AS device_type, 
            COALESCE(NULLIF(os, ''), 'Unknown') AS os, 
            COALESCE(NULLIF(browser, ''), 'Unknown') AS browser, 
            created_at
        FROM public.page_views
        WHERE created_at >= start_ts
          AND (excluded_visitors IS NULL OR array_length(excluded_visitors, 1) IS NULL OR NOT (visitor_id = ANY(excluded_visitors)))
    ),
    summary AS (
        SELECT 
            count(*)::bigint AS total_views,
            count(DISTINCT visitor_id)::bigint AS unique_visitors
        FROM filtered
    ),
    traffic AS (
        SELECT 
            to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day_str,
            count(*)::bigint AS views,
            count(DISTINCT visitor_id)::bigint AS visitors
        FROM filtered
        WHERE created_at >= chart_start_ts
        GROUP BY 1
        ORDER BY 1 ASC
    ),
    top_p AS (
        SELECT 
            COALESCE(path, '/') AS path,
            count(*)::bigint AS views
        FROM filtered
        GROUP BY 1
        ORDER BY 2 DESC
        LIMIT 10
    ),
    dev AS (
        SELECT 
            device_type AS name,
            count(*)::bigint AS value
        FROM filtered
        GROUP BY 1
        ORDER BY 2 DESC
    ),
    os_data AS (
        SELECT 
            os AS name,
            count(*)::bigint AS value
        FROM filtered
        GROUP BY 1
        ORDER BY 2 DESC
    ),
    browsers_data AS (
        SELECT 
            browser AS name,
            count(*)::bigint AS value
        FROM filtered
        GROUP BY 1
        ORDER BY 2 DESC
    )
    SELECT json_build_object(
        'total_views', (SELECT total_views FROM summary),
        'unique_visitors', (SELECT unique_visitors FROM summary),
        'traffic', COALESCE((SELECT json_agg(t) FROM traffic t), '[]'::json),
        'top_pages', COALESCE((SELECT json_agg(p) FROM top_p p), '[]'::json),
        'devices', COALESCE((SELECT json_agg(d) FROM dev d), '[]'::json),
        'os', COALESCE((SELECT json_agg(o) FROM os_data o), '[]'::json),
        'browsers', COALESCE((SELECT json_agg(b) FROM browsers_data b), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

-- Security Hardening
REVOKE EXECUTE ON FUNCTION public.get_analytics_summary(integer, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_summary(integer, text[]) TO service_role;
