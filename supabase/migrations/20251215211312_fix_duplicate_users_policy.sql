/*
  # Fix Security Issues - Part 4: Remove Duplicate Users Policy

  1. Remove Duplicate Policy
    - Drop "Enable insert for authenticated users only" policy
    - Keep "Users can insert own data" policy (more secure)
    - This fixes the "Multiple Permissive Policies" warning

  Note: Keeping the more specific policy that checks auth.uid() = id
*/

-- Drop the more generic policy (less secure)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;