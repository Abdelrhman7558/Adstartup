/*
  # Add verified column to users table

  1. Modifications
    - Add `verified` boolean column to users table
    - Default to false for new users
    - Set existing users to false

  2. Purpose
    - Track email verification status
    - Prevent unverified users from signing in
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'verified'
  ) THEN
    ALTER TABLE users ADD COLUMN verified boolean DEFAULT false;
  END IF;
END $$;
