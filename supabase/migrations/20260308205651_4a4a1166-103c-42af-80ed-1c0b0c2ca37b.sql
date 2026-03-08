
-- Just add document_url column if the previous migration was rolled back
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS document_url text DEFAULT NULL;
