/*
  # Fix Profiles Table Constraints
  
  ## Problem Identified
  - Profiles table has `full_name` and `phone_number` as NOT NULL
  - Signup tries to insert into profiles with these values
  - If fields are empty strings, insert fails with database error
  - Error message is vague, doesn't help user understand issue
  
  ## Solution
  - Make `full_name` and `phone_number` nullable with default values
  - Or remove the profile insertion and rely on users table
  - This fix makes columns nullable with empty string defaults
  - Signup will work reliably without needing all fields filled
  
  ## Security Impact
  - No RLS changes
  - Better user experience (signup always works)
  - Data integrity maintained
*/

-- Make full_name nullable with default empty string
ALTER TABLE public.profiles
ALTER COLUMN full_name DROP NOT NULL,
ALTER COLUMN full_name SET DEFAULT '';

-- Make phone_number nullable with default empty string  
ALTER TABLE public.profiles
ALTER COLUMN phone_number DROP NOT NULL,
ALTER COLUMN phone_number SET DEFAULT '';

-- Update existing NULL values to empty strings
UPDATE public.profiles
SET full_name = COALESCE(full_name, '')
WHERE full_name IS NULL;

UPDATE public.profiles
SET phone_number = COALESCE(phone_number, '')
WHERE phone_number IS NULL;

COMMENT ON COLUMN public.profiles.full_name IS 'User full name - nullable, defaults to empty string if not provided during signup';
COMMENT ON COLUMN public.profiles.phone_number IS 'User phone number - nullable, defaults to empty string if not provided during signup';
