/*
  # Fix User Creation Trigger to Use Metadata

  1. Problem
    - Current trigger tries to use NEW.phone which doesn't exist in auth.users
    - Phone number is stored in raw_user_meta_data as phone_number
    - This causes the phone_number to be NULL in public.users table

  2. Solution
    - Update trigger function to extract phone_number from metadata
    - Use NEW.raw_user_meta_data->>'phone_number' to get the value
    - Ensure proper handling when metadata is NULL or missing

  3. Changes
    - Replace trigger function with updated version
    - Extract phone_number from user metadata correctly
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone_number, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.phone),
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_states (user_id, current_step, created_at)
  VALUES (
    NEW.id,
    'signed_up',
    NEW.created_at
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;