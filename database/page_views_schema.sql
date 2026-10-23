-- STATEMENT
DO $$
BEGIN
  -- Add event_type if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='page_views' AND column_name='event_type') THEN
    ALTER TABLE page_views ADD COLUMN event_type TEXT DEFAULT 'page_view';
  END IF;
  
  -- Add user_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='page_views' AND column_name='user_id') THEN
    ALTER TABLE page_views ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- Add session_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='page_views' AND column_name='session_id') THEN
    ALTER TABLE page_views ADD COLUMN session_id TEXT;
  END IF;

  -- Add referrer if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='page_views' AND column_name='referrer') THEN
    ALTER TABLE page_views ADD COLUMN referrer TEXT;
  END IF;
END $$;

-- STATEMENT
-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_event_type ON page_views(event_type);
