/*
  # Fix user_assets table schema

  Ensures user_assets table has:
  - proper public_url column
  - correct RLS policies for user isolation
  
  Note: Table already exists, this adds missing column and fixes RLS if needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_assets' AND column_name = 'public_url'
  ) THEN
    ALTER TABLE user_assets ADD COLUMN public_url text;
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view own assets" ON user_assets;
DROP POLICY IF EXISTS "Users can insert own assets" ON user_assets;
DROP POLICY IF EXISTS "Users can delete own assets" ON user_assets;

CREATE POLICY "Users can view own assets"
  ON user_assets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own assets"
  ON user_assets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own assets"
  ON user_assets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
