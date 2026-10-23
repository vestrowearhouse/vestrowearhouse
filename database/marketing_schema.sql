-- Create Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'paused', -- 'active', 'paused', 'completed'
    budget NUMERIC DEFAULT 0,
    spent NUMERIC DEFAULT 0,
    roi NUMERIC DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some demo marketing campaigns for the dashboard to show instantly
INSERT INTO public.marketing_campaigns (name, status, budget, spent, roi)
VALUES 
    ('Eid Mega Sale 2024', 'active', 50000, 12500, 320),
    ('Summer Collection Facebook Ads', 'active', 20000, 18000, 150),
    ('New User Onboarding Email', 'active', 5000, 1200, 450),
    ('Winter Clearance Instagram', 'paused', 15000, 15000, 80)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read/write for authenticated users (or service role)
CREATE POLICY "Allow public read for marketing_campaigns" 
ON public.marketing_campaigns FOR SELECT USING (true);

CREATE POLICY "Allow admin all operations marketing_campaigns" 
ON public.marketing_campaigns FOR ALL USING (true);
