/*
  # Add Automatic User Creation Trigger

  1. Problem
    - Users signing up through Supabase Auth create records in auth.users
    - The public.users table needs a corresponding record
    - RLS policies prevent manual insertion during signup

  2. Solution
    - Create a trigger function that runs when new auth.users are created
    - Automatically creates corresponding records in public.users and public.user_states
    - Uses SECURITY DEFINER to bypass RLS policies

  3. Security
    - Function runs with elevated privileges (SECURITY DEFINER)
    - Only triggered by auth.users INSERT events
    - Creates records with proper user ID linkage
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, phone_number, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    NEW.created_at
  );
  
  -- Insert into public.user_states table
  INSERT INTO public.user_states (user_id, current_step, created_at)
  VALUES (
    NEW.id,
    'signed_up',
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;