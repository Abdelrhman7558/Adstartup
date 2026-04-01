/*
  # Ensure Users Update Policy for Verified Field

  1. Purpose
    - Make sure authenticated users can update their verified status
    - Ensure the UPDATE policy exists and works correctly

  2. Security
    - Users can only update their own records (auth.uid() = id)
    - This allows the AuthConfirm page to set verified=true
*/

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Recreate update policy with explicit permission for verified field
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
