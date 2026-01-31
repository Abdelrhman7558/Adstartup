/*
  # Add campaign support and brief versioning

  1. Table Updates
    - Add `campaign_name` to `use_asset` table
    
  2. New Tables
    - `user_briefs` for versioned brief data
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `version_number` (integer)
      - `data` (jsonb)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on user_briefs
    - Add policies for authenticated users
*/

-- Add campaign_name to use_asset table
ALTER TABLE use_asset ADD COLUMN IF NOT EXISTS campaign_name TEXT;

-- Create index for campaign_name on use_asset
CREATE INDEX IF NOT EXISTS idx_use_asset_campaign_name ON use_asset(campaign_name);

-- Create user_briefs table for versioned brief data
CREATE TABLE IF NOT EXISTS user_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for user_briefs
CREATE INDEX IF NOT EXISTS idx_user_briefs_user_id ON user_briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_briefs_version ON user_briefs(user_id, version_number DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_briefs_user_version ON user_briefs(user_id, version_number);

-- Enable RLS on user_briefs
ALTER TABLE user_briefs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own briefs" ON user_briefs;
DROP POLICY IF EXISTS "Users can insert own briefs" ON user_briefs;
DROP POLICY IF EXISTS "Users can update own briefs" ON user_briefs;
DROP POLICY IF EXISTS "Users can delete own briefs" ON user_briefs;

-- SELECT policy for user_briefs
CREATE POLICY "Users can view own briefs"
  ON user_briefs
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- INSERT policy for user_briefs
CREATE POLICY "Users can insert own briefs"
  ON user_briefs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- UPDATE policy for user_briefs
CREATE POLICY "Users can update own briefs"
  ON user_briefs
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- DELETE policy for user_briefs
CREATE POLICY "Users can delete own briefs"
  ON user_briefs
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);
