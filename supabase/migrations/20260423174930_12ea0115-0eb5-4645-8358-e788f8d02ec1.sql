-- 1. Create idea_financials table for 5-year financial projections
CREATE TABLE IF NOT EXISTS public.idea_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  year_number INTEGER NOT NULL CHECK (year_number BETWEEN 1 AND 5),
  expected_revenue_usd NUMERIC NOT NULL DEFAULT 0,
  expected_costs_usd NUMERIC NOT NULL DEFAULT 0,
  expected_profit_usd NUMERIC GENERATED ALWAYS AS (expected_revenue_usd - expected_costs_usd) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(idea_id, year_number)
);

ALTER TABLE public.idea_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view financials of approved ideas"
ON public.idea_financials FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_id AND (i.status = 'published' OR i.status = 'approved' OR i.founder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE POLICY "Founders manage their financials"
ON public.idea_financials FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_id AND i.founder_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_id AND i.founder_id = auth.uid()));

-- 2. WhatsApp OTP codes table (replaces Firebase for non-test users)
CREATE TABLE IF NOT EXISTS public.phone_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE public.phone_otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own otp codes"
ON public.phone_otp_codes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Only edge functions (service role) can insert/update codes
CREATE INDEX IF NOT EXISTS idx_phone_otp_user ON public.phone_otp_codes(user_id, verified, expires_at);

-- 3. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_idea_views_idea ON public.idea_views(idea_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_founder ON public.access_requests(founder_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_parties ON public.deals(founder_id, investor_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_deal ON public.payment_events(deal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);

-- 4. Auto-cleanup expired OTP codes (function)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.phone_otp_codes WHERE expires_at < now() - interval '1 hour';
$$;

-- 5. Helper function for analytics aggregation (founder dashboard)
CREATE OR REPLACE FUNCTION public.get_idea_analytics(_idea_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Only owner or admin can fetch
  IF NOT EXISTS (SELECT 1 FROM public.ideas WHERE id = _idea_id AND (founder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_views', COALESCE((SELECT COUNT(*) FROM public.idea_views WHERE idea_id = _idea_id), 0),
    'unique_viewers', COALESCE((SELECT COUNT(DISTINCT viewer_id) FROM public.idea_views WHERE idea_id = _idea_id AND viewer_id IS NOT NULL), 0),
    'access_requests_total', COALESCE((SELECT COUNT(*) FROM public.access_requests WHERE idea_id = _idea_id), 0),
    'access_requests_pending', COALESCE((SELECT COUNT(*) FROM public.access_requests WHERE idea_id = _idea_id AND status = 'pending'), 0),
    'access_requests_approved', COALESCE((SELECT COUNT(*) FROM public.access_requests WHERE idea_id = _idea_id AND status = 'approved'), 0),
    'saves_count', COALESCE((SELECT COUNT(*) FROM public.saved_ideas WHERE idea_id = _idea_id), 0),
    'deals_count', COALESCE((SELECT COUNT(*) FROM public.deals WHERE idea_id = _idea_id), 0),
    'views_last_7days', COALESCE((SELECT COUNT(*) FROM public.idea_views WHERE idea_id = _idea_id AND viewed_at > now() - interval '7 days'), 0)
  ) INTO result;

  RETURN result;
END;
$$;

-- 6. Admin platform-wide stats
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'blocked_users', (SELECT COUNT(*) FROM public.profiles WHERE is_blocked = true),
    'total_ideas', (SELECT COUNT(*) FROM public.ideas),
    'pending_kyc', (SELECT COUNT(*) FROM public.kyc_verifications WHERE status = 'pending'),
    'open_reports', (SELECT COUNT(*) FROM public.reports WHERE status = 'open'),
    'total_deals', (SELECT COUNT(*) FROM public.deals),
    'completed_deals', (SELECT COUNT(*) FROM public.deals WHERE status = 'completed'),
    'total_volume_usd', (SELECT COALESCE(SUM(investment_amount_usd), 0) FROM public.deals WHERE payment_status = 'paid'),
    'platform_revenue_usd', (SELECT COALESCE(SUM(platform_fee_amount), 0) FROM public.deals WHERE payment_status = 'paid'),
    'recent_signups_7d', (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '7 days')
  ) INTO result;

  RETURN result;
END;
$$;