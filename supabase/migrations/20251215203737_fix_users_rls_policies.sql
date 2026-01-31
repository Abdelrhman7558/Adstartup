/*
  # Fix Users Table RLS Policies

  1. Problem
    - Duplicate RLS policies exist on users table
    - Some policies use 'public' role instead of 'authenticated'
    - This can cause INSERT failures due to conflicting policy checks

  2. Solution
    - Remove all existing policies on users table
    - Recreate clean, correct policies for authenticated users only
    - Ensure INSERT policy uses WITH CHECK (auth.uid() = id)

  3. Security
    - Only authenticated users can access their own data
    - INSERT requires id to match auth.uid()
    - SELECT, UPDATE require ownership verification
*/

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Allow delete own row" ON public.users;
DROP POLICY IF EXISTS "Allow insert by authenticated user" ON public.users;
DROP POLICY IF EXISTS "Allow select own row" ON public.users;
DROP POLICY IF EXISTS "Allow update own row" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;

-- Recreate clean policies for authenticated users only
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own data"
  ON public.users FOR DELETE
  TO authenticated
  USING (auth.uid() = id);