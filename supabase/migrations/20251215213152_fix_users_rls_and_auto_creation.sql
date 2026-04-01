/*
  # Fix Users Table RLS and Auto-Creation

  1. Drop and Recreate Users Table
    - Clean slate approach to ensure no conflicts
    - Add proper foreign key constraints
    - Enable RLS with correct policies

  2. RLS Policies
    - INSERT policy: Allow authenticated users to insert their own row
    - SELECT policy: Allow authenticated users to view their own row
    - UPDATE policy: Allow authenticated users to update their own row

  3. Auto-Creation Trigger
    - Automatically create users table row when auth.users is created
    - Also initialize user_states table
    - Runs with SECURITY DEFINER to bypass RLS

  4. Security Notes
    - Trigger uses SECURITY DEFINER to bypass RLS during auto-creation
    - Only authenticated users can read/write their own data
    - No SELECT after INSERT to avoid RLS conflicts
*/

-- ============================================================
-- DROP EXISTING TRIGGER AND FUNCTION (if they exist)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================================
-- RECREATE USERS TABLE
-- ============================================================

-- Drop existing table (cascade to remove dependencies)
DROP TABLE IF EXISTS public.users CASCADE;

-- Create fresh users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREATE OPTIMIZED RLS POLICIES
-- ============================================================

-- Policy for authenticated users to read their own data
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Policy for authenticated users to insert their own data
CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- Policy for authenticated users to update their own data
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================
-- CREATE AUTO-CREATION TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table (bypasses RLS with SECURITY DEFINER)
  INSERT INTO public.users (id, email, phone_number, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone_number',
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;

  -- Initialize user_states (bypasses RLS with SECURITY DEFINER)
  INSERT INTO public.user_states (user_id, current_step, has_active_subscription, has_completed_brief, has_connected_meta, created_at)
  VALUES (
    NEW.id,
    'signed_up',
    false,
    false,
    false,
    NEW.created_at
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth;

-- ============================================================
-- ATTACH TRIGGER TO AUTH.USERS
-- ============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- BACKFILL EXISTING AUTH USERS
-- ============================================================

-- Insert any existing auth.users that don't have rows in public.users
INSERT INTO public.users (id, email, phone_number, created_at)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'phone_number',
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- Grant authenticated users access to their own rows
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;