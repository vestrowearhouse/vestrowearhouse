-- STATEMENT
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed'
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STATEMENT
-- Insert some initial dummy data for the dashboard to have something to display
INSERT INTO marketing_campaigns (name, status, budget, spent, conversions, roi)
SELECT 'Summer Electronics Sale', 'active', 50000, 12500, 340, 215.5
WHERE NOT EXISTS (SELECT 1 FROM marketing_campaigns WHERE name = 'Summer Electronics Sale');

-- STATEMENT
INSERT INTO marketing_campaigns (name, status, budget, spent, conversions, roi)
SELECT 'Facebook Retargeting', 'paused', 15000, 15000, 120, 95.2
WHERE NOT EXISTS (SELECT 1 FROM marketing_campaigns WHERE name = 'Facebook Retargeting');
