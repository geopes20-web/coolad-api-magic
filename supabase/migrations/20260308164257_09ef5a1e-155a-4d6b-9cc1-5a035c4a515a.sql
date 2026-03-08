-- Access requests table for investor-founder access control
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  founder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(investor_id, idea_id)
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Investors can create requests and see their own
CREATE POLICY "Investors can create access requests" ON public.access_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Users can view their own access requests" ON public.access_requests
  FOR SELECT TO authenticated USING (auth.uid() = investor_id OR auth.uid() = founder_id);

CREATE POLICY "Founders can update requests for their ideas" ON public.access_requests
  FOR UPDATE TO authenticated USING (auth.uid() = founder_id);

-- Add evaluation_version and decision columns to ideas
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS evaluation_version INT NOT NULL DEFAULT 1;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS decision TEXT DEFAULT 'pending';
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS execution_score INT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS investment_score INT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS ai_recommendations TEXT;
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS score_history JSONB DEFAULT '[]'::jsonb;

-- Enable realtime for access_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_requests;