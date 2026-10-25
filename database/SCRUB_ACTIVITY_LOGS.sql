-- =============================================================================
-- SUPABASE ACTIVITY LOGS SENSITIVE CREDENTIALS SCRUB SCRIPT
-- Stellar Mart BD Security Hardening
--
-- IMPORTANT:
-- Run this query manually in your Supabase SQL Editor.
-- The AI assistant will NOT execute this query automatically.
--
-- TARGET:
-- public.activity_logs (columns: id, table_name, action_type, record_id, details, created_at)
-- =============================================================================

-- ── STEP 1: PREVIEW AFFECTED ROWS (RUN THIS FIRST TO INSPECT) ────────────────
SELECT 
    COUNT(*) AS total_affected_rows,
    COUNT(*) FILTER (WHERE table_name = 'users') AS users_table_rows,
    COUNT(*) FILTER (WHERE details ?| ARRAY['password', 'password_hash', 'hash', 'token', 'access_token', 'refresh_token', 'otp', 'secret']) AS sensitive_key_rows
FROM public.activity_logs
WHERE table_name = 'users'
   OR details ?| ARRAY['password', 'password_hash', 'hash', 'token', 'access_token', 'refresh_token', 'otp', 'secret'];

-- Preview the latest 10 affected records:
SELECT id, table_name, action_type, record_id, created_at
FROM public.activity_logs
WHERE table_name = 'users'
   OR details ?| ARRAY['password', 'password_hash', 'hash', 'token', 'access_token', 'refresh_token', 'otp', 'secret']
ORDER BY created_at DESC
LIMIT 10;


-- ── STEP 2: SCRUB SENSITIVE DATA FROM ACTIVITY LOGS ──────────────────────────

-- A. Scrub all logs originating from 'users' table
-- (Replaces entire user payload dump with a safe audit marker)
UPDATE public.activity_logs
SET details = jsonb_build_object(
    'sanitized', true,
    'note', 'Sensitive credentials scrubbed for security compliance',
    'record_id', record_id,
    'action', action_type
)
WHERE table_name = 'users';

-- B. Strip individual sensitive keys from any remaining tables (orders, products, etc.)
UPDATE public.activity_logs
SET details = details 
    - 'password' 
    - 'password_hash' 
    - 'hash' 
    - 'token' 
    - 'access_token' 
    - 'refresh_token' 
    - 'otp' 
    - 'secret' 
    - 'cvv' 
    - 'card' 
    - 'pin'
WHERE details ?| ARRAY['password', 'password_hash', 'hash', 'token', 'access_token', 'refresh_token', 'otp', 'secret', 'cvv', 'card', 'pin'];


-- ── STEP 3: VERIFY THAT NO SENSITIVE KEYS REMAIN ─────────────────────────────
SELECT 
    COUNT(*) AS remaining_sensitive_rows
FROM public.activity_logs
WHERE details ?| ARRAY['password', 'password_hash', 'hash', 'token', 'access_token', 'refresh_token', 'otp', 'secret'];
