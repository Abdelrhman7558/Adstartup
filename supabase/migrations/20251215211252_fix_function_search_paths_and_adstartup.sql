/*
  # Fix Security Issues - Part 3: Function Search Paths & Adstartup Policies

  1. Fix Function Search Paths
    - Set search_path for `handle_updated_at` function
    - Set search_path for `get_teams_for_user` function
    - This prevents security issues from mutable search paths

  2. Add RLS Policies to Adstartup Table
    - Currently has RLS enabled but no policies
    - Add policies to allow authenticated users to manage their own data

  Note: Functions are recreated with SECURITY DEFINER and explicit search_path
*/

-- ============================================================
-- FIX FUNCTION: handle_updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- ============================================================
-- FIX FUNCTION: get_teams_for_user
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_teams_for_user(user_uuid UUID)
RETURNS TABLE(team_id UUID, team_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name
  FROM public.teams t
  JOIN public.team_members tm ON tm.team_id = t.id
  WHERE tm.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_teams_for_user(UUID) TO authenticated;

-- ============================================================
-- ADSTARTUP TABLE - Add RLS Policies
-- ============================================================

-- Note: This table appears to be a legacy auth table
-- Adding basic policies to allow authenticated users to manage their own data

-- Policy for reading own data (based on email)
CREATE POLICY "Users can view own adstartup data"
  ON public."Adstartup"
  FOR SELECT
  TO authenticated
  USING (email = (select auth.jwt()->>'email'));

-- Policy for inserting own data
CREATE POLICY "Users can insert own adstartup data"
  ON public."Adstartup"
  FOR INSERT
  TO authenticated
  WITH CHECK (email = (select auth.jwt()->>'email'));

-- Policy for updating own data
CREATE POLICY "Users can update own adstartup data"
  ON public."Adstartup"
  FOR UPDATE
  TO authenticated
  USING (email = (select auth.jwt()->>'email'))
  WITH CHECK (email = (select auth.jwt()->>'email'));

-- Policy for deleting own data
CREATE POLICY "Users can delete own adstartup data"
  ON public."Adstartup"
  FOR DELETE
  TO authenticated
  USING (email = (select auth.jwt()->>'email'));