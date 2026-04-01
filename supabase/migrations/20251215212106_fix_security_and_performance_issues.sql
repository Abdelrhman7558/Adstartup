/*
  # Fix Security and Performance Issues

  1. Add Missing Foreign Key Indexes
    - Add index on `payments.user_id` for foreign key lookup performance
    - Add index on `subscriptions.user_id` for foreign key lookup performance
    - These indexes improve JOIN performance and foreign key constraint checks

  2. Remove Unused Indexes
    - Drop `idx_payments_subscription_id` (not being used)
    - Drop `idx_team_members_user_id` (not being used)
    - Drop `idx_campaign_briefs_user_id` (not being used)
    - Removing unused indexes reduces storage and write overhead

  3. Optimize Adstartup RLS Policies
    - Replace policies to use subquery form for auth functions
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale

  4. Security Notes
    - All foreign key columns now have covering indexes for optimal performance
    - RLS policies use the most efficient form of auth function calls
    - Unused indexes removed to reduce maintenance overhead
*/

-- ============================================================
-- ADD MISSING FOREIGN KEY INDEXES
-- ============================================================

-- Index for payments.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_payments_user_id 
  ON public.payments(user_id);

-- Index for subscriptions.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
  ON public.subscriptions(user_id);

-- ============================================================
-- REMOVE UNUSED INDEXES
-- ============================================================

-- These indexes exist but are not being used by queries
DROP INDEX IF EXISTS public.idx_payments_subscription_id;
DROP INDEX IF EXISTS public.idx_team_members_user_id;
DROP INDEX IF EXISTS public.idx_campaign_briefs_user_id;

-- ============================================================
-- OPTIMIZE ADSTARTUP RLS POLICIES
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own adstartup data" ON public."Adstartup";
DROP POLICY IF EXISTS "Users can insert own adstartup data" ON public."Adstartup";
DROP POLICY IF EXISTS "Users can update own adstartup data" ON public."Adstartup";
DROP POLICY IF EXISTS "Users can delete own adstartup data" ON public."Adstartup";

-- Recreate policies with optimized auth function calls
-- Using subquery form prevents re-evaluation for each row

CREATE POLICY "Users can view own adstartup data"
  ON public."Adstartup"
  FOR SELECT
  TO authenticated
  USING (email = (SELECT (auth.jwt()->>'email')));

CREATE POLICY "Users can insert own adstartup data"
  ON public."Adstartup"
  FOR INSERT
  TO authenticated
  WITH CHECK (email = (SELECT (auth.jwt()->>'email')));

CREATE POLICY "Users can update own adstartup data"
  ON public."Adstartup"
  FOR UPDATE
  TO authenticated
  USING (email = (SELECT (auth.jwt()->>'email')))
  WITH CHECK (email = (SELECT (auth.jwt()->>'email')));

CREATE POLICY "Users can delete own adstartup data"
  ON public."Adstartup"
  FOR DELETE
  TO authenticated
  USING (email = (SELECT (auth.jwt()->>'email')));