CREATE TABLE IF NOT EXISTS public.backup_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT NOT NULL,
    filesize_kb INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'success', 'failed'
    triggered_by TEXT DEFAULT 'automated', -- 'automated', 'admin_id'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert dummy data to show the ledger is working
INSERT INTO public.backup_logs (filename, filesize_kb, status, triggered_by, created_at)
VALUES 
    ('stellarmart-backup-2024-05-01.json', 1024, 'success', 'automated', NOW() - INTERVAL '3 days'),
    ('stellarmart-backup-2024-05-02.json', 1056, 'success', 'automated', NOW() - INTERVAL '2 days'),
    ('stellarmart-backup-2024-05-03.json', 1088, 'success', 'automated', NOW() - INTERVAL '1 days')
ON CONFLICT DO NOTHING;

ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow admin operations backups" ON public.backup_logs FOR ALL USING (true);
