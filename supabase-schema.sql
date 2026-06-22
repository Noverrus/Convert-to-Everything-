-- Create conversions table
CREATE TABLE public.conversions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  original_url text NOT NULL,
  converted_url text,
  status text NOT NULL DEFAULT 'pending'::text,
  target_format text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Setup Row Level Security (RLS)
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

-- Security Policies (Ensure proper Auth rules in production, assuming open for this demo)
CREATE POLICY "Allow public inserts" ON public.conversions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON public.conversions FOR SELECT USING (true);
CREATE POLICY "Allow update by worker only" ON public.conversions FOR UPDATE USING (true); -- Use Service Role internally

-- Enable Realtime for the frontend
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversions;

-- Setup Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', true);

CREATE POLICY "Public files upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'files');
CREATE POLICY "Public files review" ON storage.objects FOR SELECT USING (bucket_id = 'files');

-- Enable pg_cron extension (Superuser/Database Admin required)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create an auto-delete function to clear old conversions after 1 Hour
-- This effectively trims Postgres memory and costs autonomously
SELECT cron.schedule('cleanup-conversions', '0 * * * *', $$
  DELETE FROM public.conversions WHERE created_at < NOW() - INTERVAL '1 hour';
$$);
