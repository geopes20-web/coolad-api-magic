DROP POLICY IF EXISTS "Admins can view all access requests" ON public.access_requests;
CREATE POLICY "Admins can view all access requests"
ON public.access_requests FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update all access requests" ON public.access_requests;
CREATE POLICY "Admins can update all access requests"
ON public.access_requests FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));