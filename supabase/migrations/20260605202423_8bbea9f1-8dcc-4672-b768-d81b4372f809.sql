-- Ensure RLS is enabled
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Ensure required grants exist for Data API access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;

-- Drop any prior variants of these named policies
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.deals;
DROP POLICY IF EXISTS "Allow users to view their deals" ON public.deals;
DROP POLICY IF EXISTS "Allow users to update their deals" ON public.deals;

-- Authenticated users can insert deals when they are a party
CREATE POLICY "Allow authenticated insert" ON public.deals
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = investor_id OR auth.uid() = founder_id);

-- Authenticated users can view deals they participate in
CREATE POLICY "Allow users to view their deals" ON public.deals
FOR SELECT TO authenticated
USING (auth.uid() = investor_id OR auth.uid() = founder_id);

-- Authenticated users can update deals they participate in
CREATE POLICY "Allow users to update their deals" ON public.deals
FOR UPDATE TO authenticated
USING (auth.uid() = investor_id OR auth.uid() = founder_id)
WITH CHECK (auth.uid() = investor_id OR auth.uid() = founder_id);