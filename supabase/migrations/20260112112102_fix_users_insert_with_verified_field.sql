/*
  # Fix Users Insert with Verified Field

  1. Modifications
    - Update handle_new_user() trigger to include verified field
    - Set verified to false by default
    - Update existing users to have verified = false if null

  2. Purpose
    - Fix signup flow by ensuring verified field is created automatically
    - No need for manual insert from client side
*/

-- Update the trigger function to include verified field
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table (bypasses RLS with SECURITY DEFINER)
  INSERT INTO public.users (id, email, phone_number, verified, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone_number',
    false,
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone_number = EXCLUDED.phone_number,
    verified = COALESCE(public.users.verified, false);

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

-- Update existing users to have verified = false if null
UPDATE public.users 
SET verified = false 
WHERE verified IS NULL;
