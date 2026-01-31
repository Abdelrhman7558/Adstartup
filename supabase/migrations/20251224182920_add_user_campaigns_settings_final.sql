/*
  # Add User Campaigns and Settings Tables

  1. New Tables
    - `user_campaigns`
      - User-created campaigns with files (separate from Meta campaigns)
      - Stores campaign details and directory path
    
    - `user_campaign_files`
      - Files uploaded for user campaigns
      - Links to user_campaigns table

  2. Table Modifications
    - Add `display_name` to users table
    - Add `theme_preference` to users table

  3. Security
    - Enable RLS on all new tables
    - Add policies for users to manage their own data

  4. Indexes
    - Performance indexes on foreign keys and timestamps
*/

-- Create update function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user_campaigns table (different from Meta campaigns)
CREATE TABLE IF NOT EXISTS user_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_name text NOT NULL,
  campaign_objective text NOT NULL,
  target_country text NOT NULL,
  daily_budget numeric(10,2) NOT NULL CHECK (daily_budget > 0),
  campaign_notes text,
  directory_path text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_campaign_files table
CREATE TABLE IF NOT EXISTS user_campaign_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES user_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_path text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Add columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE users ADD COLUMN display_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'theme_preference'
  ) THEN
    ALTER TABLE users ADD COLUMN theme_preference text DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE user_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_campaign_files ENABLE ROW LEVEL SECURITY;

-- User campaigns policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_campaigns' AND policyname = 'Users can view own user_campaigns'
  ) THEN
    CREATE POLICY "Users can view own user_campaigns"
      ON user_campaigns FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_campaigns' AND policyname = 'Users can create own user_campaigns'
  ) THEN
    CREATE POLICY "Users can create own user_campaigns"
      ON user_campaigns FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_campaigns' AND policyname = 'Users can update own user_campaigns'
  ) THEN
    CREATE POLICY "Users can update own user_campaigns"
      ON user_campaigns FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_campaigns' AND policyname = 'Users can delete own user_campaigns'
  ) THEN
    CREATE POLICY "Users can delete own user_campaigns"
      ON user_campaigns FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- User campaign files policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_campaign_files' AND policyname = 'Users can view own user_campaign_files'
  ) THEN
    CREATE POLICY "Users can view own user_campaign_files"
      ON user_campaign_files FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_campaign_files' AND policyname = 'Users can create own user_campaign_files'
  ) THEN
    CREATE POLICY "Users can create own user_campaign_files"
      ON user_campaign_files FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_campaign_files' AND policyname = 'Users can delete own user_campaign_files'
  ) THEN
    CREATE POLICY "Users can delete own user_campaign_files"
      ON user_campaign_files FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_campaigns_user_id ON user_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_campaigns_created_at ON user_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_campaign_files_campaign_id ON user_campaign_files(campaign_id);
CREATE INDEX IF NOT EXISTS idx_user_campaign_files_user_id ON user_campaign_files(user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_campaigns_updated_at ON user_campaigns;
CREATE TRIGGER update_user_campaigns_updated_at
  BEFORE UPDATE ON user_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();