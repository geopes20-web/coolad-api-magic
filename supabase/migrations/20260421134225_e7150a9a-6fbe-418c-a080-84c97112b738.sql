
DROP POLICY IF EXISTS "Anyone can record a view" ON public.idea_views;

CREATE POLICY "Authenticated users can record a view"
ON public.idea_views FOR INSERT
TO authenticated
WITH CHECK (
  viewer_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.ideas i
    WHERE i.id = idea_id AND i.founder_id = auth.uid()
  )
);
