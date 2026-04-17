
-- ============================================
-- 1. COMPANIES DATASET (for RAG / ML predictions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.companies_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  company_type TEXT,
  sector TEXT,
  description TEXT,
  problem TEXT,
  solution TEXT,
  target_audience TEXT,
  location TEXT,
  country TEXT,
  team_size INTEGER,
  founded_year INTEGER,
  total_funding_usd BIGINT,
  funding_round TEXT,
  risk_score NUMERIC,
  success_probability NUMERIC,
  market_share_pct NUMERIC,
  website TEXT,
  status TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_sector ON public.companies_dataset(sector);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies_dataset(status);

ALTER TABLE public.companies_dataset ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read companies dataset"
  ON public.companies_dataset FOR SELECT USING (true);

-- ============================================
-- 2. KYC VERIFICATIONS
-- ============================================
CREATE TYPE public.kyc_status AS ENUM ('not_started', 'pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS public.kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status public.kyc_status NOT NULL DEFAULT 'not_started',
  full_legal_name TEXT,
  national_id TEXT,
  date_of_birth DATE,
  nationality TEXT,
  address TEXT,
  phone_number TEXT,
  id_document_url TEXT,
  selfie_url TEXT,
  proof_of_address_url TEXT,
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC"
  ON public.kyc_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KYC"
  ON public.kyc_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending KYC"
  ON public.kyc_verifications FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('not_started', 'pending', 'rejected'));

-- ============================================
-- 3. NDA AGREEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.nda_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL,
  founder_id UUID NOT NULL,
  investor_id UUID NOT NULL,
  nda_content TEXT NOT NULL,
  investor_signed_at TIMESTAMPTZ,
  investor_signature TEXT,
  founder_signed_at TIMESTAMPTZ,
  founder_signature TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(idea_id, investor_id)
);

ALTER TABLE public.nda_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view their NDA"
  ON public.nda_agreements FOR SELECT
  USING (auth.uid() = founder_id OR auth.uid() = investor_id);

CREATE POLICY "Investors can create NDA"
  ON public.nda_agreements FOR INSERT
  WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Parties can sign NDA"
  ON public.nda_agreements FOR UPDATE
  USING (auth.uid() = founder_id OR auth.uid() = investor_id);

-- ============================================
-- 4. INVESTMENT CONTRACTS / DEALS
-- ============================================
CREATE TYPE public.deal_status AS ENUM (
  'draft', 'pending_founder', 'pending_investor', 
  'negotiating', 'signed', 'completed', 'cancelled'
);

CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL,
  founder_id UUID NOT NULL,
  investor_id UUID NOT NULL,
  investment_amount_usd NUMERIC(15,2) NOT NULL,
  equity_percentage NUMERIC(5,2),
  valuation_usd NUMERIC(15,2),
  contract_terms TEXT NOT NULL,
  contract_url TEXT,
  status public.deal_status NOT NULL DEFAULT 'draft',
  founder_signed_at TIMESTAMPTZ,
  investor_signed_at TIMESTAMPTZ,
  platform_fee_percentage NUMERIC(5,2) NOT NULL DEFAULT 5.0,
  platform_fee_amount NUMERIC(15,2),
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view their deals"
  ON public.deals FOR SELECT
  USING (auth.uid() = founder_id OR auth.uid() = investor_id);

CREATE POLICY "Investors can create deals"
  ON public.deals FOR INSERT
  WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Parties can update their deals"
  ON public.deals FOR UPDATE
  USING (auth.uid() = founder_id OR auth.uid() = investor_id);

-- ============================================
-- 5. PAYMENT WEBHOOK EVENTS (for future gateway)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'manual',
  external_reference TEXT,
  amount_usd NUMERIC(15,2),
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Only deal participants can view payment events
CREATE POLICY "Participants can view payment events"
  ON public.payment_events FOR SELECT
  USING (
    deal_id IN (
      SELECT id FROM public.deals
      WHERE founder_id = auth.uid() OR investor_id = auth.uid()
    )
  );

-- ============================================
-- 6. CHAT VIOLATIONS LOG (for security audit)
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  receiver_id UUID,
  blocked_content TEXT NOT NULL,
  detected_patterns TEXT[] NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own violations"
  ON public.chat_violations FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 7. ADD MARKETPLACE FILTER COLUMNS TO IDEAS
-- ============================================
ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS capital_required_usd NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS expected_revenue_usd NUMERIC(15,2);

CREATE INDEX IF NOT EXISTS idx_ideas_sector ON public.ideas(sector);
CREATE INDEX IF NOT EXISTS idx_ideas_capital ON public.ideas(capital_required_usd);
CREATE INDEX IF NOT EXISTS idx_ideas_risk ON public.ideas(risk_score);
CREATE INDEX IF NOT EXISTS idx_ideas_ai_score ON public.ideas(ai_score);

-- ============================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_kyc_updated_at BEFORE UPDATE ON public.kyc_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nda_updated_at BEFORE UPDATE ON public.nda_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
