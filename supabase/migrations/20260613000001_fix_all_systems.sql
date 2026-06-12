-- =====================================================================
-- IDEVEST — Master Fix Migration  (2026-06-13)
-- Covers: data_room_access table, deals/profiles missing columns,
--         payment_events dedup index, RLS policies
-- =====================================================================

-- ────────────────────────────────────────────────────────────────────
-- 1. profiles: add full_name / phone_number if missing
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name    text,
  ADD COLUMN IF NOT EXISTS phone_number text;

-- ────────────────────────────────────────────────────────────────────
-- 2. deals: add platform fee + escrow columns if missing
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS platform_fee_percentage numeric DEFAULT 10,
  ADD COLUMN IF NOT EXISTS platform_fee_amount     numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escrow_status           text    DEFAULT 'none'
    CHECK (escrow_status IN ('none','held','captured','refunded','failed','completed'));

-- ────────────────────────────────────────────────────────────────────
-- 3. data_room_access table
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.data_room_access (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
  idea_id           uuid NOT NULL,
  status            text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','failed','refunded')),
  payment_reference text,
  deal_id           uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Unique: one active record per user+idea
CREATE UNIQUE INDEX IF NOT EXISTS idx_data_room_access_user_idea
  ON public.data_room_access(user_id, idea_id);

CREATE INDEX IF NOT EXISTS idx_data_room_access_idea
  ON public.data_room_access(idea_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_data_room_access_updated_at ON public.data_room_access;
CREATE TRIGGER update_data_room_access_updated_at
  BEFORE UPDATE ON public.data_room_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ────────────────────────────────────────────────────────────────────
-- 4. RLS on data_room_access
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.data_room_access ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.data_room_access TO authenticated;
GRANT ALL ON public.data_room_access TO service_role;

DROP POLICY IF EXISTS "Users can view own data room access"  ON public.data_room_access;
DROP POLICY IF EXISTS "Users can insert own data room access" ON public.data_room_access;
DROP POLICY IF EXISTS "Service role can update status"        ON public.data_room_access;

CREATE POLICY "Users can view own data room access"
  ON public.data_room_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data room access"
  ON public.data_room_access FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS automatically; this policy is extra clarity
CREATE POLICY "Service role can update status"
  ON public.data_room_access FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────
-- 5. payment_events: add idea_id column + composite uniqueness index
--    to prevent duplicate "already being processed" inserts
-- ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'payment_events'
      AND column_name  = 'idea_id'
  ) THEN
    ALTER TABLE public.payment_events ADD COLUMN idea_id uuid;
    ALTER TABLE public.payment_events ADD COLUMN user_id uuid;
  END IF;
END;
$$;

-- Drop any stuck/pending payment events to allow fresh attempts
-- (only removes events that are still 'pending' — not completed ones)
DELETE FROM public.payment_events
WHERE status = 'pending'
  AND created_at < now() - interval '30 minutes';

-- Partial unique index: only one active processing event per idea+user
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_active_idea_user
  ON public.payment_events(idea_id, user_id)
  WHERE status = 'pending';

-- ────────────────────────────────────────────────────────────────────
-- 6. Ensure handle_new_user trigger correctly populates profiles
--    (idempotent replace)
-- ────────────────────────────────────────────────────────────────────
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
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email,'@',1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name    = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number;

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

-- ────────────────────────────────────────────────────────────────────
-- 7. Fix email confirmation: disable mandatory email confirmation
--    so users can login right after registration
--    (This is a Supabase config; do it via Dashboard > Auth > Settings
--     Set "Enable email confirmations" = OFF for dev, or use OTP flow)
-- ────────────────────────────────────────────────────────────────────

-- Patch: auto-confirm any existing unconfirmed users so login works
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- ────────────────────────────────────────────────────────────────────
-- 8. ideas table: ensure status column has 'published' as valid value
--    and add 'publish' button support via policies
-- ────────────────────────────────────────────────────────────────────
ALTER TABLE public.ideas
  ALTER COLUMN status SET DEFAULT 'draft';

-- Allow founder to update their own idea status (for publish button)
DROP POLICY IF EXISTS "Founders can update own ideas" ON public.ideas;
CREATE POLICY "Founders can update own ideas"
  ON public.ideas FOR UPDATE
  TO authenticated
  USING (auth.uid() = founder_id)
  WITH CHECK (auth.uid() = founder_id);

-- ────────────────────────────────────────────────────────────────────
-- 9. Marketplace: ensure published ideas are visible to all
-- ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Published ideas visible to all" ON public.ideas;
CREATE POLICY "Published ideas visible to all"
  ON public.ideas FOR SELECT
  TO authenticated, anon
  USING (
    status = 'published'
    OR auth.uid() = founder_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Grant read to anon for marketplace browsing
GRANT SELECT ON public.ideas TO anon;
GRANT SELECT ON public.profiles TO anon;
