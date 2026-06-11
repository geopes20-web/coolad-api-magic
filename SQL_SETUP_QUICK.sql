-- COPY PASTE THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- استنسخ والصق كل هذا في SQL Editor في Supabase

-- ✅ Step 1: Create payment_events table
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'paymob',
  event_type text NOT NULL,
  merchant_order_id text NOT NULL,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- ✅ Step 2: Fix data_room_access RLS
DROP POLICY IF EXISTS "Users view own data room access" ON public.data_room_access;
DROP POLICY IF EXISTS "Users insert own data room access" ON public.data_room_access;
DROP POLICY IF EXISTS "Service role full access data room" ON public.data_room_access;

CREATE POLICY "dr_select_own" ON public.data_room_access FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "dr_insert_own" ON public.data_room_access FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dr_update_own" ON public.data_room_access FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dr_service_role" ON public.data_room_access FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ✅ Step 3: Add columns to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS external_reference TEXT UNIQUE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS platform_fee_percentage NUMERIC(5,2) DEFAULT 10;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10,2) DEFAULT 0;

-- ✅ Step 4: Fix deals RLS
DROP POLICY IF EXISTS "Founders and investors view own deals" ON public.deals;

CREATE POLICY "deal_select" ON public.deals FOR SELECT TO authenticated USING (auth.uid() = founder_id OR auth.uid() = investor_id);
CREATE POLICY "deal_update" ON public.deals FOR UPDATE TO authenticated USING (auth.uid() = founder_id OR auth.uid() = investor_id) WITH CHECK (auth.uid() = founder_id OR auth.uid() = investor_id);
CREATE POLICY "deal_service_role" ON public.deals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ✅ Step 5: Add phone_number to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT DEFAULT '+201000000000';

-- ✅ DONE! Check results below:
SELECT 'payment_events' as table_name, count(*) FROM public.payment_events
UNION ALL
SELECT 'deals', count(*) FROM public.deals
UNION ALL
SELECT 'data_room_access', count(*) FROM public.data_room_access
UNION ALL
SELECT 'profiles', count(*) FROM public.profiles;
