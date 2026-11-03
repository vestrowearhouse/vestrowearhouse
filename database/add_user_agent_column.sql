-- ========================================================================
-- Migration: Add user_agent column to public.page_views
-- Enables storing raw User-Agent headers for bot auditing and diagnostics.
-- Safe, idempotent, zero backfill required.
-- ========================================================================

ALTER TABLE public.page_views 
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Composite index to support high-performance 30s visitor+path deduplication queries
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_path_created 
ON public.page_views(visitor_id, path, created_at DESC);
