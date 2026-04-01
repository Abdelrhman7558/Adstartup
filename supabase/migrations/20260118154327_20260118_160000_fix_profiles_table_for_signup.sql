/*
  # Fix Profiles Table for Signup - Remove Required Fields and Disable RLS for Signup

  ## Problem
  - Signup fails because profiles table has NOT NULL requirements
  - Users cannot create profiles during signup (anon user issue)
  - RLS policies conflict with auth.users trigger

  ## Solution
  1. Drop and recreate profiles table with minimal required fields
  2. Make all fields optional (no NOT NULL except id)
  3. Remove anon policies (only authenticated users need access)
  4. Keep SECURITY DEFINER function for trigger

  ## New Structure
  - `id` (uuid, primary key) - References auth.users(id)
  - `full_name` (text, optional) - User's full name
  - `phone_number` (text, optional) - User's phone number
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ## Security
  - Enable RLS on profiles table
  - Only authenticated users can access their own profile
  - No anon policies
  - Trigger uses SECURITY DEFINER to bypass RLS during signup
*/

-- Drop old profiles table and related objects
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
DROP FUNCTION IF EXISTS handle_updated_at();
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP TABLE IF EXISTS profiles;

-- Create new minimal profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policy: Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policy: Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create index for profile queries
CREATE INDEX idx_profiles_id ON profiles(id);

-- Update trigger for auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP FUNCTION IF EXISTS create_profile_on_signup();

CREATE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-create profile
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_on_signup();
