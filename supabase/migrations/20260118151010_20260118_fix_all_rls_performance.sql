/*
  # Fix ALL RLS Performance Issues

  Replace auth.uid() with (SELECT auth.uid()) in all policies
  This prevents per-row re-evaluation and improves query performance
*/

-- Fix policies that still use bare auth.uid()
-- These need to be dropped and recreated with (SELECT auth.uid())

-- active_ads
DROP POLICY IF EXISTS "Users can delete own ads" ON public.active_ads;
DROP POLICY IF EXISTS "Users can insert own ads" ON public.active_ads;
DROP POLICY IF EXISTS "Users can update own ads" ON public.active_ads;
DROP POLICY IF EXISTS "Users can view own ads" ON public.active_ads;

CREATE POLICY "Users can view own ads" ON public.active_ads FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own ads" ON public.active_ads FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own ads" ON public.active_ads FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own ads" ON public.active_ads FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ad_actions
DROP POLICY IF EXISTS "Users can create ad actions" ON public.ad_actions;
DROP POLICY IF EXISTS "Users can update own ad actions" ON public.ad_actions;
DROP POLICY IF EXISTS "Users can view own ad actions" ON public.ad_actions;

CREATE POLICY "Users can view own ad actions" ON public.ad_actions FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can create ad actions" ON public.ad_actions FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own ad actions" ON public.ad_actions FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- ads
DROP POLICY IF EXISTS "Users can create ads" ON public.ads;
DROP POLICY IF EXISTS "Users can delete own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can update own ads" ON public.ads;
DROP POLICY IF EXISTS "Users can view own ads" ON public.ads;

CREATE POLICY "Users can view own ads" ON public.ads FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can create ads" ON public.ads FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own ads" ON public.ads FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own ads" ON public.ads FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ads_performance
DROP POLICY IF EXISTS "Users can create own performance data" ON public.ads_performance;
DROP POLICY IF EXISTS "Users can delete own performance data" ON public.ads_performance;
DROP POLICY IF EXISTS "Users can update own performance data" ON public.ads_performance;
DROP POLICY IF EXISTS "Users can view own performance data" ON public.ads_performance;

CREATE POLICY "Users can view own performance data" ON public.ads_performance FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can create own performance data" ON public.ads_performance FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own performance data" ON public.ads_performance FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own performance data" ON public.ads_performance FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- campaigns
DROP POLICY IF EXISTS "Users can create own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can view own campaigns" ON public.campaigns;

CREATE POLICY "Users can view own campaigns" ON public.campaigns FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can create own campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own campaigns" ON public.campaigns FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- client_briefs
DROP POLICY IF EXISTS "Users can delete own briefs" ON public.client_briefs;
DROP POLICY IF EXISTS "Users can insert own briefs" ON public.client_briefs;
DROP POLICY IF EXISTS "Users can update own briefs" ON public.client_briefs;
DROP POLICY IF EXISTS "Users can view own briefs" ON public.client_briefs;

CREATE POLICY "Users can view own briefs" ON public.client_briefs FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own briefs" ON public.client_briefs FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own briefs" ON public.client_briefs FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own briefs" ON public.client_briefs FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- marketing_ads
DROP POLICY IF EXISTS "Users can delete own marketing ads" ON public.marketing_ads;
DROP POLICY IF EXISTS "Users can insert own marketing ads" ON public.marketing_ads;
DROP POLICY IF EXISTS "Users can update own marketing ads" ON public.marketing_ads;
DROP POLICY IF EXISTS "Users can view own marketing ads" ON public.marketing_ads;

CREATE POLICY "Users can view own marketing ads" ON public.marketing_ads FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own marketing ads" ON public.marketing_ads FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own marketing ads" ON public.marketing_ads FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own marketing ads" ON public.marketing_ads FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- marketing_campaigns
DROP POLICY IF EXISTS "Users can delete own marketing campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Users can insert own marketing campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Users can update own marketing campaigns" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "Users can view own marketing campaigns" ON public.marketing_campaigns;

CREATE POLICY "Users can view own marketing campaigns" ON public.marketing_campaigns FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own marketing campaigns" ON public.marketing_campaigns FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own marketing campaigns" ON public.marketing_campaigns FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own marketing campaigns" ON public.marketing_campaigns FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- marketing_sales_trend
DROP POLICY IF EXISTS "Users can delete own marketing sales trend" ON public.marketing_sales_trend;
DROP POLICY IF EXISTS "Users can insert own marketing sales trend" ON public.marketing_sales_trend;
DROP POLICY IF EXISTS "Users can update own marketing sales trend" ON public.marketing_sales_trend;
DROP POLICY IF EXISTS "Users can view own marketing sales trend" ON public.marketing_sales_trend;

CREATE POLICY "Users can view own marketing sales trend" ON public.marketing_sales_trend FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own marketing sales trend" ON public.marketing_sales_trend FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own marketing sales trend" ON public.marketing_sales_trend FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own marketing sales trend" ON public.marketing_sales_trend FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- meta_account_selections
DROP POLICY IF EXISTS "Users can create own meta selections" ON public.meta_account_selections;
DROP POLICY IF EXISTS "Users can delete own meta selections" ON public.meta_account_selections;
DROP POLICY IF EXISTS "Users can update own meta selections" ON public.meta_account_selections;
DROP POLICY IF EXISTS "Users can view own meta selections" ON public.meta_account_selections;

CREATE POLICY "Users can view own meta selections" ON public.meta_account_selections FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can create own meta selections" ON public.meta_account_selections FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own meta selections" ON public.meta_account_selections FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own meta selections" ON public.meta_account_selections FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- meta_connections - also remove duplicates
DROP POLICY IF EXISTS "Users can insert own meta connection" ON public.meta_connections;
DROP POLICY IF EXISTS "Users can insert own meta connections" ON public.meta_connections;
DROP POLICY IF EXISTS "Users can read own meta connections" ON public.meta_connections;
DROP POLICY IF EXISTS "Users can update own meta connection" ON public.meta_connections;
DROP POLICY IF EXISTS "Users can update own meta connections" ON public.meta_connections;
DROP POLICY IF EXISTS "Users can view own meta connections" ON public.meta_connections;
DROP POLICY IF EXISTS "meta_insert_own" ON public.meta_connections;
DROP POLICY IF EXISTS "meta_select_own" ON public.meta_connections;
DROP POLICY IF EXISTS "meta_update_own" ON public.meta_connections;

CREATE POLICY "meta_select_own" ON public.meta_connections FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "meta_insert_own" ON public.meta_connections FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "meta_update_own" ON public.meta_connections FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- use_asset (user_id is text)
DROP POLICY IF EXISTS "Users can delete own files" ON public.use_asset;
DROP POLICY IF EXISTS "Users can insert own files" ON public.use_asset;
DROP POLICY IF EXISTS "Users can update own files" ON public.use_asset;
DROP POLICY IF EXISTS "Users can view own files" ON public.use_asset;

CREATE POLICY "Users can view own files" ON public.use_asset FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid())::text);
CREATE POLICY "Users can insert own files" ON public.use_asset FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid())::text);
CREATE POLICY "Users can update own files" ON public.use_asset FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())::text) WITH CHECK (user_id = (SELECT auth.uid())::text);
CREATE POLICY "Users can delete own files" ON public.use_asset FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid())::text);

-- user_briefs
DROP POLICY IF EXISTS "briefs_insert_own" ON public.user_briefs;
DROP POLICY IF EXISTS "briefs_select_own" ON public.user_briefs;
DROP POLICY IF EXISTS "briefs_update_own" ON public.user_briefs;

CREATE POLICY "briefs_select_own" ON public.user_briefs FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "briefs_insert_own" ON public.user_briefs FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "briefs_update_own" ON public.user_briefs FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- user_campaign_files
DROP POLICY IF EXISTS "Users can create own user_campaign_files" ON public.user_campaign_files;
DROP POLICY IF EXISTS "Users can delete own user_campaign_files" ON public.user_campaign_files;
DROP POLICY IF EXISTS "Users can view own user_campaign_files" ON public.user_campaign_files;

CREATE POLICY "Users can view own user_campaign_files" ON public.user_campaign_files FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can create own user_campaign_files" ON public.user_campaign_files FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own user_campaign_files" ON public.user_campaign_files FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- user_campaigns
DROP POLICY IF EXISTS "Users can create own user_campaigns" ON public.user_campaigns;
DROP POLICY IF EXISTS "Users can delete own user_campaigns" ON public.user_campaigns;
DROP POLICY IF EXISTS "Users can update own user_campaigns" ON public.user_campaigns;
DROP POLICY IF EXISTS "Users can view own user_campaigns" ON public.user_campaigns;

CREATE POLICY "Users can view own user_campaigns" ON public.user_campaigns FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can create own user_campaigns" ON public.user_campaigns FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own user_campaigns" ON public.user_campaigns FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own user_campaigns" ON public.user_campaigns FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- users table
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

CREATE POLICY "users_select_own" ON public.users FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY "users_insert_own" ON public.users FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "users_update_own" ON public.users FOR UPDATE TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

-- webhooks
DROP POLICY IF EXISTS "Users can insert webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Users can update own webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Users can view own webhooks" ON public.webhooks;

CREATE POLICY "Users can view own webhooks" ON public.webhooks FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert webhooks" ON public.webhooks FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own webhooks" ON public.webhooks FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- workspaces
DROP POLICY IF EXISTS "Users can create own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can delete own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can update own workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view own workspaces" ON public.workspaces;

CREATE POLICY "Users can view own workspaces" ON public.workspaces FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can create own workspaces" ON public.workspaces FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can update own workspaces" ON public.workspaces FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can delete own workspaces" ON public.workspaces FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- campaign_assets (user_id is text)
DROP POLICY IF EXISTS "Users can delete own campaign assets" ON public.campaign_assets;
DROP POLICY IF EXISTS "Users can insert own campaign assets" ON public.campaign_assets;
DROP POLICY IF EXISTS "Users can view own campaign assets" ON public.campaign_assets;

CREATE POLICY "Users can view own campaign assets" ON public.campaign_assets FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid())::text);
CREATE POLICY "Users can insert own campaign assets" ON public.campaign_assets FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid())::text);
CREATE POLICY "Users can delete own campaign assets" ON public.campaign_assets FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid())::text);

-- email_verification_tokens
DROP POLICY IF EXISTS "tokens_select_own" ON public.email_verification_tokens;
CREATE POLICY "tokens_select_own" ON public.email_verification_tokens FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
