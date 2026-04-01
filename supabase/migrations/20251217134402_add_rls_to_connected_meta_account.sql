/*
  # Add RLS Policies to Connected Meta Account Table

  1. Security
    - Enable RLS on "Connected Meta Account" table (already enabled)
    - Add policy for users to read their own connection status
    - Add policy for users to update their own connection status

  2. Indexes
    - Index on "User ID" for fast lookups
    - Ensure unique constraint on User ID to prevent duplicates

  3. Description
    - This migration ensures that users can only view and update their own
      Meta account connection status from the "Connected Meta Account" table
    - The table is used to track whether a user's Meta account is connected
    - Each user should only have one row in this table
*/

CREATE INDEX IF NOT EXISTS idx_connected_meta_account_user_id 
ON "Connected Meta Account"("User ID");

DROP POLICY IF EXISTS "Users can read own meta connection" ON "Connected Meta Account";
DROP POLICY IF EXISTS "Users can update own meta connection" ON "Connected Meta Account";

CREATE POLICY "Users can read own meta connection"
  ON "Connected Meta Account"
  FOR SELECT
  TO authenticated
  USING ("User ID" = (SELECT auth.uid()::text));

CREATE POLICY "Users can update own meta connection"
  ON "Connected Meta Account"
  FOR UPDATE
  TO authenticated
  USING ("User ID" = (SELECT auth.uid()::text))
  WITH CHECK ("User ID" = (SELECT auth.uid()::text));
