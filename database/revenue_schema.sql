-- Create Payouts Table
CREATE TABLE IF NOT EXISTS public.vendor_payouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL DEFAULT 0,
    platform_fee NUMERIC NOT NULL DEFAULT 0,
    method TEXT NOT NULL DEFAULT 'bank_transfer',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vendor_payouts ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY "Admins have full access to vendor_payouts" ON public.vendor_payouts
  FOR ALL USING (true);

-- Vendors can view their own
CREATE POLICY "Vendors can view own payouts" ON public.vendor_payouts
  FOR SELECT USING (vendor_id = auth.uid());
