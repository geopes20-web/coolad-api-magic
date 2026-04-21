
-- ============ 1. SECURITY: Block self-promotion to admin ============
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

CREATE POLICY "Users can insert own non-admin role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role <> 'admin'::app_role
);

CREATE POLICY "Admins can insert any role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ 2. KYC: add selfie + mindee data + phone verification ============
ALTER TABLE public.kyc_verifications
  ADD COLUMN IF NOT EXISTS mindee_extracted_data jsonb,
  ADD COLUMN IF NOT EXISTS mindee_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS face_match_score numeric;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_reason text,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz;

-- ============ 3. Idea views tracking ============
CREATE TABLE IF NOT EXISTS public.idea_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL,
  viewer_id uuid,
  viewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_idea_views_idea ON public.idea_views(idea_id);

ALTER TABLE public.idea_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a view"
ON public.idea_views FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Owner sees view counts"
ON public.idea_views FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.ideas i WHERE i.id = idea_id AND i.founder_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- ============ 4. Reports table ============
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('user','idea','message','deal')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporter can view own reports"
ON public.reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ 5. Idea listing_type + milestones ============
DO $$ BEGIN
  CREATE TYPE public.idea_listing_type AS ENUM ('sell_only','sell_and_execute','partnership');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS listing_type public.idea_listing_type NOT NULL DEFAULT 'sell_and_execute',
  ADD COLUMN IF NOT EXISTS milestones jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS expected_5yr_revenue_usd numeric,
  ADD COLUMN IF NOT EXISTS problem_solved text,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0;

-- ============ 6. Deals: platform fee fixed at 15% ============
ALTER TABLE public.deals
  ALTER COLUMN platform_fee_percentage SET DEFAULT 15.0,
  ADD COLUMN IF NOT EXISTS escrow_hold_id text,
  ADD COLUMN IF NOT EXISTS escrow_status text DEFAULT 'none' CHECK (escrow_status IN ('none','held','captured','refunded','failed')),
  ADD COLUMN IF NOT EXISTS deal_type text NOT NULL DEFAULT 'sell_and_execute';

-- ============ 7. Update handle_new_user: any @gmail can register, admin role assignable by separate function ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails text[] := ARRAY['admin@idevest.com'];
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  ) ON CONFLICT (id) DO NOTHING;

  -- Auto-grant admin to predefined emails
  IF NEW.email = ANY(admin_emails) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ 8. Admin RPC: promote user (admin-only) ============
CREATE OR REPLACE FUNCTION public.admin_grant_role(_target_user uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can grant roles';
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_target_user, _role)
  ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_block_user(_target_user uuid, _reason text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can block users';
  END IF;
  UPDATE public.profiles
  SET is_blocked = true, blocked_reason = _reason, blocked_at = now()
  WHERE id = _target_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unblock_user(_target_user uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can unblock users';
  END IF;
  UPDATE public.profiles
  SET is_blocked = false, blocked_reason = NULL, blocked_at = NULL
  WHERE id = _target_user;
END;
$$;

-- Atomic increment view counter
CREATE OR REPLACE FUNCTION public.increment_idea_views(_idea_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.ideas SET view_count = view_count + 1 WHERE id = _idea_id;
END;
$$;
