/*
  # Fix Supabase Auth Signup - Profiles Table Trigger

  1. Problem
    - Supabase Auth signup fails with "Database error creating new user"
    - Root cause: No trigger populates `public.profiles` on user creation
    - RLS INSERT policy blocks anonymous inserts

  2. Solution
    - Create SECURITY DEFINER function to bypass RLS
    - Add trigger on auth.users to auto-populate profiles
    - Ensures profiles row exists for every new user

  3. Changes
    - Create `handle_new_user_profile()` function with SECURITY DEFINER
    - Add trigger `on_auth_user_created_profile` on auth.users
    - Insert minimal profile data (id, created_at, updated_at)
*/

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Create function to handle profile creation (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    phone_number,
    created_at,
    updated_at,
    meta_connected,
    enable_webhooks
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    now(),
    now(),
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();
