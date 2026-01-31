/*
  # Fix Security and Performance Issues

  1. Add Missing Foreign Key Indexes
    - Add index on campaign_briefs.user_id for better FK performance
    - Add index on payments.subscription_id for better FK performance

  2. Optimize RLS Policies on Adstartup Table
    - Policies currently use auth.jwt() which re-evaluates for each row
    - Replace with optimized subquery pattern per Supabase guidelines
    - Uses email-based authentication instead of user_id

  3. Clean Up Indexes
    - Remove unused index on payments.user_id
    - Remove unused index on subscriptions.user_id
    - Add composite index for common query patterns

  4. Add Performance Indexes
    - Add indexes for frequently queried foreign keys
    - Add composite indexes for common query patterns

  5. Security Notes
    - Foreign key indexes improve query performance
    - RLS optimization prevents function re-evaluation
    - Composite indexes support common WHERE clauses
*/

-- ============================================================
-- ADD MISSING FOREIGN KEY INDEXES
-- ============================================================

-- Index for campaign_briefs.user_id (foreign key constraint)
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_user_id
  ON public.campaign_briefs(user_id);

-- Index for payments.subscription_id (foreign key constraint)
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id
  ON public.payments(subscription_id);

-- ============================================================
-- OPTIMIZE RLS POLICIES ON ADSTARTUP TABLE
-- ============================================================

-- Drop existing policies on Adstartup table
DROP POLICY IF EXISTS "Users can view own adstartup data" ON public."Adstartup";
DROP POLICY IF EXISTS "Users can insert own adstartup data" ON public."Adstartup";
DROP POLICY IF EXISTS "Users can update own adstartup data" ON public."Adstartup";
DROP POLICY IF EXISTS "Users can delete own adstartup data" ON public."Adstartup";

-- Recreate policies with optimized pattern
-- Note: Adstartup table uses email-based authentication
CREATE POLICY "Users can view own adstartup data"
  ON public."Adstartup"
  FOR SELECT
  TO authenticated
  USING (email = (SELECT auth.jwt() ->> 'email'));

CREATE POLICY "Users can insert own adstartup data"
  ON public."Adstartup"
  FOR INSERT
  TO authenticated
  WITH CHECK (email = (SELECT auth.jwt() ->> 'email'));

CREATE POLICY "Users can update own adstartup data"
  ON public."Adstartup"
  FOR UPDATE
  TO authenticated
  USING (email = (SELECT auth.jwt() ->> 'email'))
  WITH CHECK (email = (SELECT auth.jwt() ->> 'email'));

CREATE POLICY "Users can delete own adstartup data"
  ON public."Adstartup"
  FOR DELETE
  TO authenticated
  USING (email = (SELECT auth.jwt() ->> 'email'));

-- ============================================================
-- CLEAN UP UNUSED INDEXES
-- ============================================================

-- Drop unused index on payments.user_id
DROP INDEX IF EXISTS public.idx_payments_user_id;

-- Drop unused index on subscriptions.user_id
DROP INDEX IF EXISTS public.idx_subscriptions_user_id;

-- ============================================================
-- ADD PERFORMANCE INDEXES
-- ============================================================

-- Composite index for common subscriptions query pattern
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions(user_id, status);

-- Index for user_states lookups
CREATE INDEX IF NOT EXISTS idx_user_states_user_id
  ON public.user_states(user_id);

-- Index for meta_connections lookups
CREATE INDEX IF NOT EXISTS idx_meta_connections_user_id
  ON public.meta_connections(user_id);

-- Index for profiles lookups (if not already present)
CREATE INDEX IF NOT EXISTS idx_profiles_id
  ON public.profiles(id);

-- Index for Adstartup email lookups (since RLS policies use it)
CREATE INDEX IF NOT EXISTS idx_adstartup_email
  ON public."Adstartup"(email);