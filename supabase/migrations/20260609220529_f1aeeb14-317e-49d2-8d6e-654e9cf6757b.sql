CREATE TABLE IF NOT EXISTS public.data_room_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  amount_usd numeric(10,2) NOT NULL DEFAULT 5.00,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, idea_id)
);

GRANT SELECT ON public.data_room_access TO authenticated;
GRANT ALL ON public.data_room_access TO service_role;

ALTER TABLE public.data_room_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own data room access"
  ON public.data_room_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_data_room_access_updated_at
  BEFORE UPDATE ON public.data_room_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();