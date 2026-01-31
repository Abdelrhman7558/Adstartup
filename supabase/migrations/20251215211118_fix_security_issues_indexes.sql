/*
  # Fix Security Issues - Part 1: Indexes

  1. Add Missing Foreign Key Indexes
    - Add index on `payments.subscription_id`
    - Add index on `team_members.user_id`

  2. Remove Unused Indexes
    - Drop `idx_subscriptions_stripe_customer_id`
    - Drop `idx_subscriptions_stripe_subscription_id`
    - Drop `idx_subscriptions_user_id`
    - Drop `idx_subscriptions_status`
    - Drop `idx_payments_user_id`
    - Drop `idx_meta_connections_user_id`

  3. Remove Duplicate Indexes
    - Drop `idx_briefs_user_id` (keeping `idx_campaign_briefs_user_id`)
*/

-- Add missing foreign key indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Remove unused indexes
DROP INDEX IF EXISTS public.idx_subscriptions_stripe_customer_id;
DROP INDEX IF EXISTS public.idx_subscriptions_stripe_subscription_id;
DROP INDEX IF EXISTS public.idx_subscriptions_user_id;
DROP INDEX IF EXISTS public.idx_subscriptions_status;
DROP INDEX IF EXISTS public.idx_payments_user_id;
DROP INDEX IF EXISTS public.idx_meta_connections_user_id;

-- Remove duplicate index (keep idx_campaign_briefs_user_id)
DROP INDEX IF EXISTS public.idx_briefs_user_id;