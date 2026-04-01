-- =========================================================================
-- SECURITY AUDIT ENHANCEMENTS: Strict Row Level Security (RLS)
-- =========================================================================
-- This migration enforces strict Row Level Security policies to protect
-- sensitive data including Payment structures and Meta access tokens.

-- 1. SECURE: meta_connections (Protects `access_token` and `ad_account_id`)
-- -------------------------------------------------------------------------
ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;

-- Remove old loose policies if any
DROP POLICY IF EXISTS "Users can view their own meta connections" ON public.meta_connections;
DROP POLICY IF EXISTS "Users can insert their own meta connections" ON public.meta_connections;
DROP POLICY IF EXISTS "Users can update their own meta connections" ON public.meta_connections;
DROP POLICY IF EXISTS "Users can delete their own meta connections" ON public.meta_connections;

-- Apply strict isolation
CREATE POLICY "Users can view their own meta connections"
    ON public.meta_connections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meta connections"
    ON public.meta_connections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meta connections"
    ON public.meta_connections FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meta connections"
    ON public.meta_connections FOR DELETE USING (auth.uid() = user_id);


-- 2. SECURE: subscriptions (Protects subscription and payment details)
-- -------------------------------------------------------------------------
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
    ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
    ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);


-- 3. SECURE: payments (Protects transaction integrity)
-- -------------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;

CREATE POLICY "Users can view their own payments"
    ON public.payments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
    ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 4. SECURE: briefs (Protects business secrets and ideas)
-- -------------------------------------------------------------------------
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own briefs" ON public.briefs;
DROP POLICY IF EXISTS "Users can manage their own briefs" ON public.briefs;

CREATE POLICY "Users can view their own briefs"
    ON public.briefs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own briefs"
    ON public.briefs FOR ALL USING (auth.uid() = user_id);


-- 5. SECURE: ads (Protects Ads tracking integrity)
-- -------------------------------------------------------------------------
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can manage their own ads" ON public.ads;

CREATE POLICY "Users can view their own ads"
    ON public.ads FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can manage their own ads"
    ON public.ads FOR ALL USING (auth.uid() = user_id);
