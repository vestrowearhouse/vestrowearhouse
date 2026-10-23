-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- STATEMENT

-- 2. Add embedding column of type vector(768) to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(768);

-- STATEMENT

-- 3. Create match_products similarity search RPC function
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  price numeric,
  original_price numeric,
  category text,
  category_slug text,
  images jsonb,
  stock int,
  status text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    products.name,
    products.slug,
    products.description,
    products.price,
    products.original_price,
    products.category,
    products.category_slug,
    products.images,
    products.stock,
    products.status,
    1 - (products.embedding <=> query_embedding) AS similarity
  FROM products
  WHERE products.status = 'active'
    AND products.embedding IS NOT NULL
    AND 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY products.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- STATEMENT

-- 4. Create chat_sessions database table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_token TEXT UNIQUE NOT NULL,
  session_type TEXT DEFAULT 'customer' CHECK (session_type IN ('customer', 'vendor')),
  status TEXT DEFAULT 'ai' CHECK (status IN ('ai', 'human', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STATEMENT

-- 5. Create chat_messages database table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai', 'admin')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STATEMENT

-- Indexes for chat tables
CREATE INDEX IF NOT EXISTS idx_chat_sessions_token ON chat_sessions(session_token);

-- STATEMENT

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

-- STATEMENT

CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- STATEMENT

-- 6. Setup Realtime Replication
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- STATEMENT

ALTER TABLE chat_sessions REPLICA IDENTITY FULL;

-- STATEMENT

-- Attempt to add tables to supabase_realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    -- Try to add tables, ignoring if they are already added
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
