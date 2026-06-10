DROP TABLE IF EXISTS public.data_room_access;

ALTER TABLE public.access_requests
  DROP COLUMN IF EXISTS data_room_fee_usd,
  DROP COLUMN IF EXISTS payment_status,
  DROP COLUMN IF EXISTS payment_reference;

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
    'total_volume_usd', (SELECT COALESCE(SUM(investment_amount_usd), 0) FROM public.deals WHERE payment_status = 'paid'),
    'platform_revenue_usd', (SELECT COALESCE(SUM(platform_fee_amount), 0) FROM public.deals WHERE payment_status = 'paid'),
    'recent_signups_7d', (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '7 days')
  ) INTO result;

  RETURN result;
END;
$$;