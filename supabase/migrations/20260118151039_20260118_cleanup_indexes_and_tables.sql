/*
  # Cleanup Unused Indexes and Fix RLS Issues

  1. Drop unused indexes to improve write performance
  2. Fix duplicate indexes
  3. Disable RLS for tables that don't need user-level security
*/

-- Drop unused indexes
DROP INDEX IF EXISTS public.idx_payments_subscription_id;
DROP INDEX IF EXISTS public.idx_use_asset_campaign_id;
DROP INDEX IF EXISTS public.idx_webhooks_user_id;
DROP INDEX IF EXISTS public.idx_webhooks_status;
DROP INDEX IF EXISTS public.idx_webhooks_created_at;
DROP INDEX IF EXISTS public.idx_notifications_user_id;
DROP INDEX IF EXISTS public.idx_use_asset_user_campaign;
DROP INDEX IF EXISTS public.idx_connected_meta_account_user_id;
DROP INDEX IF EXISTS public.idx_campaigns_user_id;
DROP INDEX IF EXISTS public.idx_campaigns_start_date;
DROP INDEX IF EXISTS public.idx_ads_performance_user_id;
DROP INDEX IF EXISTS public.idx_ads_performance_date;
DROP INDEX IF EXISTS public.idx_ads_performance_ad_id;
DROP INDEX IF EXISTS public.idx_payments_user_id;
DROP INDEX IF EXISTS public.idx_ads_status;
DROP INDEX IF EXISTS public.idx_ads_created_at;
DROP INDEX IF EXISTS public.idx_use_asset_uploaded_at;
DROP INDEX IF EXISTS public.idx_use_asset_campaign_name;
DROP INDEX IF EXISTS public.idx_ad_actions_user_id;
DROP INDEX IF EXISTS public.idx_ad_actions_ad_id;
DROP INDEX IF EXISTS public.idx_ad_actions_status;
DROP INDEX IF EXISTS public.idx_ad_actions_created_at;
DROP INDEX IF EXISTS public.idx_workspaces_user_id;
DROP INDEX IF EXISTS public.idx_workspaces_default;
DROP INDEX IF EXISTS public.idx_client_briefs_created_at;
DROP INDEX IF EXISTS public.idx_active_ads_created_at;
DROP INDEX IF EXISTS public.idx_user_campaigns_created_at;
DROP INDEX IF EXISTS public.idx_user_campaign_files_campaign_id;
DROP INDEX IF EXISTS public.idx_user_campaign_files_user_id;
DROP INDEX IF EXISTS public.idx_meta_pages_user_id;
DROP INDEX IF EXISTS public.idx_marketing_campaigns_date_start;
DROP INDEX IF EXISTS public.idx_marketing_campaigns_roas;
DROP INDEX IF EXISTS public.idx_marketing_campaigns_user_id;
DROP INDEX IF EXISTS public.idx_marketing_campaigns_status;
DROP INDEX IF EXISTS public.idx_marketing_ads_user_id;
DROP INDEX IF EXISTS public.idx_marketing_ads_campaign_id;
DROP INDEX IF EXISTS public.idx_marketing_ads_status;
DROP INDEX IF EXISTS public.idx_marketing_sales_trend_user_id;
DROP INDEX IF EXISTS public.idx_marketing_sales_trend_date;
DROP INDEX IF EXISTS public.idx_marketing_sales_trend_user_date;
DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_users_status;
DROP INDEX IF EXISTS public.idx_users_plan_type;
DROP INDEX IF EXISTS public.idx_users_trial_end;
DROP INDEX IF EXISTS public.idx_email_tokens_token;
DROP INDEX IF EXISTS public.idx_email_tokens_user;
DROP INDEX IF EXISTS public.idx_meta_connections_user;

-- Drop duplicate index (keep the one with _id suffix)
DROP INDEX IF EXISTS public.idx_meta_connections_user;

-- Disable RLS for utility/system tables that don't need user-level security
ALTER TABLE IF EXISTS public."Accounts" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Store" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Strategies" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents DISABLE ROW LEVEL SECURITY;
