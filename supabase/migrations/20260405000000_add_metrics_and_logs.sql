-- Recreate meta_campaigns table (was dropped in a previous cleanup migration but is required for Meta sync)
CREATE TABLE IF NOT EXISTS public.meta_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  name TEXT,
  status TEXT,
  objective TEXT,
  budget NUMERIC,
  spend NUMERIC DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  roas NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  cpc NUMERIC DEFAULT 0,
  cpa NUMERIC DEFAULT 0,
  frequency NUMERIC,
  cpm NUMERIC,
  landing_page_views INTEGER DEFAULT 0,
  cost_per_lpv NUMERIC DEFAULT 0,
  content_view_cost NUMERIC DEFAULT 0,
  content_view_value NUMERIC DEFAULT 0,
  add_to_cart_cost NUMERIC DEFAULT 0,
  add_to_cart_value NUMERIC DEFAULT 0,
  checkout_cost NUMERIC DEFAULT 0,
  checkout_value NUMERIC DEFAULT 0,
  optimization_enabled BOOLEAN DEFAULT false,
  optimization_enabled_at TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  last_fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- Enable RLS for meta_campaigns
ALTER TABLE public.meta_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meta_campaigns
CREATE POLICY "Users can manage own meta campaigns" ON public.meta_campaigns FOR
ALL TO authenticated USING (auth.uid() = user_id);

-- Index for meta_campaigns
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_user_id ON public.meta_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_campaign_id ON public.meta_campaigns(campaign_id);

-- Create optimization_logs table
CREATE TABLE IF NOT EXISTS public.optimization_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  action_type TEXT NOT NULL, -- 'scale', 'optimize', 'pause', 'skip', 'fatigue'
  action_detail TEXT,
  reason TEXT,
  status TEXT DEFAULT 'success', -- 'success', 'failed', 'skipped'
  bot_phase TEXT, -- 'testing', 'optimizing', 'scaling'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for optimization_logs
ALTER TABLE public.optimization_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for optimization_logs
CREATE POLICY "Users can read own optimization logs" ON public.optimization_logs FOR
SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own optimization logs" ON public.optimization_logs FOR
INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create bot_instructions table
CREATE TABLE IF NOT EXISTS public.bot_instructions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  instruction TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'executed', 'failed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for bot_instructions
ALTER TABLE public.bot_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bot instructions" ON public.bot_instructions FOR
ALL TO authenticated USING (auth.uid() = user_id);

-- Index for bot_instructions
CREATE INDEX IF NOT EXISTS idx_bot_instructions_user_id ON public.bot_instructions(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_instructions_campaign_id ON public.bot_instructions(campaign_id);
