/*
  # Create Campaign System Tables
  
  1. Tables
    - campaigns: Stores campaign information with start/end datetime
    - campaign_assets: Stores campaign asset files
  
  2. Security
    - Enable RLS on both tables
    - Users can only access their own campaigns and assets
  
  3. Indexes
    - user_id lookups
    - campaign_id foreign key
*/

-- Drop existing constraints if they conflict
DO $$
BEGIN
  -- We'll work with the existing campaigns table structure
  -- Add missing columns if they don't exist
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'campaign_name'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN campaign_name TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'description'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'start_datetime'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN start_datetime TIMESTAMP;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'end_datetime'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN end_datetime TIMESTAMP;
  END IF;
END $$;

-- Create campaign_assets table
CREATE TABLE IF NOT EXISTS campaign_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  file_type TEXT,
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE campaign_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_assets
CREATE POLICY "Users can view own campaign assets"
  ON campaign_assets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own campaign assets"
  ON campaign_assets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own campaign assets"
  ON campaign_assets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_assets_campaign_id ON campaign_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_user_id ON campaign_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id_created ON campaigns(user_id, created_at DESC);
