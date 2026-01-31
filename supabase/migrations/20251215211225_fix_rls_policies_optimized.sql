/*
  # Fix Security Issues - Part 2: RLS Policy Optimization

  1. Optimize RLS Policies for Performance
    - Replace `auth.uid()` with `(select auth.uid())` in all policies
    - This prevents re-evaluation for each row and improves query performance

  2. Tables Updated
    - profiles (uses `id` column)
    - subscriptions (uses `user_id` column)
    - campaign_briefs (uses `user_id` column)
    - payments (uses `user_id` column)
    - meta_connections (uses `user_id` column)
    - users (uses `id` column)
    - user_states (uses `user_id` column)
    - teams (uses EXISTS check)
    - team_members (uses `user_id` column)

  Note: This migration drops and recreates policies with optimized auth checks.
*/

-- ============================================================
-- PROFILES TABLE (uses id column)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ============================================================
-- SUBSCRIPTIONS TABLE (uses user_id column)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- CAMPAIGN_BRIEFS TABLE (uses user_id column)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own briefs" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Users can insert own briefs" ON public.campaign_briefs;
DROP POLICY IF EXISTS "Users can update own briefs" ON public.campaign_briefs;

CREATE POLICY "Users can view own briefs"
  ON public.campaign_briefs
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own briefs"
  ON public.campaign_briefs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own briefs"
  ON public.campaign_briefs
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- PAYMENTS TABLE (uses user_id column)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;

CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own payments"
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- META_CONNECTIONS TABLE (uses user_id column)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own meta connections" ON public.meta_connections;
DROP POLICY IF EXISTS "Users can insert own meta connections" ON public.meta_connections;
DROP POLICY IF EXISTS "Users can update own meta connections" ON public.meta_connections;

CREATE POLICY "Users can view own meta connections"
  ON public.meta_connections
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own meta connections"
  ON public.meta_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own meta connections"
  ON public.meta_connections
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================
-- USERS TABLE (uses id column)
-- ============================================================
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete own data" ON public.users;

CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can delete own data"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (id = (select auth.uid()));

-- ============================================================
-- USER_STATES TABLE (uses user_id column)
-- ============================================================
DROP POLICY IF EXISTS "Users can read own state" ON public.user_states;
DROP POLICY IF EXISTS "Users can insert own state" ON public.user_states;
DROP POLICY IF EXISTS "Users can update own state" ON public.user_states;
DROP POLICY IF EXISTS "Users can delete own state" ON public.user_states;

CREATE POLICY "Users can read own state"
  ON public.user_states
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own state"
  ON public.user_states
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own state"
  ON public.user_states
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own state"
  ON public.user_states
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================
-- TEAMS TABLE
-- ============================================================
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;

CREATE POLICY "Team members can view their teams"
  ON public.teams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = (select auth.uid())
    )
  );

-- ============================================================
-- TEAM_MEMBERS TABLE (uses user_id column)
-- ============================================================
DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.team_members;

CREATE POLICY "Users can view team members of their teams"
  ON public.team_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = (select auth.uid())
    )
  );