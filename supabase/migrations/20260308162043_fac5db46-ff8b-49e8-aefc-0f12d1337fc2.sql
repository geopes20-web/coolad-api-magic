
-- Ideas table
CREATE TABLE public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sector TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  capital_required TEXT NOT NULL DEFAULT '',
  expected_revenue TEXT NOT NULL DEFAULT '',
  team_size TEXT NOT NULL DEFAULT '',
  team_experience TEXT NOT NULL DEFAULT '',
  competitors TEXT NOT NULL DEFAULT '',
  competitive_advantage TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  timeline TEXT NOT NULL DEFAULT '',
  additional_info TEXT DEFAULT '',
  founder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ai_score INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  market_score INTEGER DEFAULT 0,
  innovation_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  ai_evaluation TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Anyone can browse published ideas
CREATE POLICY "Anyone can view ideas" ON public.ideas FOR SELECT USING (true);
-- Founders can insert their own ideas
CREATE POLICY "Founders can insert ideas" ON public.ideas FOR INSERT WITH CHECK (auth.uid() = founder_id);
-- Founders can update their own ideas
CREATE POLICY "Founders can update own ideas" ON public.ideas FOR UPDATE USING (auth.uid() = founder_id);
-- Founders can delete their own ideas
CREATE POLICY "Founders can delete own ideas" ON public.ideas FOR DELETE USING (auth.uid() = founder_id);

-- Saved ideas (bookmarks)
CREATE TABLE public.saved_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, idea_id)
);

ALTER TABLE public.saved_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved ideas" ON public.saved_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save ideas" ON public.saved_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave ideas" ON public.saved_ideas FOR DELETE USING (auth.uid() = user_id);
