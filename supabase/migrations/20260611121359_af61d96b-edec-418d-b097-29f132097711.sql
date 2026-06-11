ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS external_reference text;
CREATE INDEX IF NOT EXISTS idx_deals_external_reference ON public.deals(external_reference);