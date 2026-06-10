CREATE TABLE IF NOT EXISTS public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance_usd numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet" ON public.user_wallets;
CREATE POLICY "Users can view own wallet"
ON public.user_wallets FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage wallets" ON public.user_wallets;
CREATE POLICY "Admins can manage wallets"
ON public.user_wallets FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_usd numeric NOT NULL,
  direction text NOT NULL DEFAULT 'debit',
  transaction_type text NOT NULL DEFAULT 'data_room_fee',
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'paymob',
  external_reference text,
  access_request_id uuid,
  deal_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet transactions"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can manage wallet transactions"
ON public.wallet_transactions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.access_requests
  ADD COLUMN IF NOT EXISTS data_room_fee_usd numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_reference text;

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_access_request_id ON public.wallet_transactions(access_request_id);

DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON public.user_wallets;
CREATE TRIGGER update_user_wallets_updated_at
BEFORE UPDATE ON public.user_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.ensure_user_wallet(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  wallet_id uuid;
BEGIN
  INSERT INTO public.user_wallets(user_id)
  VALUES (_user_id)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO wallet_id;
  RETURN wallet_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
    'published_ideas', (SELECT COUNT(*) FROM public.ideas WHERE status IN ('published','approved')),
    'pending_kyc', (SELECT COUNT(*) FROM public.kyc_verifications WHERE status = 'pending'),
    'approved_kyc', (SELECT COUNT(*) FROM public.kyc_verifications WHERE status = 'approved'),
    'open_reports', (SELECT COUNT(*) FROM public.reports WHERE status = 'open'),
    'total_deals', (SELECT COUNT(*) FROM public.deals),
    'completed_deals', (SELECT COUNT(*) FROM public.deals WHERE status = 'completed'),
    'pending_payments', (SELECT COUNT(*) FROM public.deals WHERE payment_status IN ('pending','authorized')),
    'paid_data_room_requests', (SELECT COUNT(*) FROM public.access_requests WHERE payment_status = 'paid'),
    'total_volume_usd', (SELECT COALESCE(SUM(investment_amount_usd), 0) FROM public.deals WHERE payment_status = 'paid'),
    'platform_revenue_usd', (SELECT COALESCE(SUM(platform_fee_amount), 0) FROM public.deals WHERE payment_status = 'paid'),
    'wallet_fees_usd', (SELECT COALESCE(SUM(amount_usd), 0) FROM public.wallet_transactions WHERE status = 'paid' AND transaction_type = 'data_room_fee'),
    'recent_signups_7d', (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '7 days')
  ) INTO result;

  RETURN result;
END;
$$;