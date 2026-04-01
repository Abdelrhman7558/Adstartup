/*
  # Add Campaign ID and Fix Storage Structure
  
  1. Schema Changes
    - Add `campaign_id` UUID column to `use_asset` table
    - Add foreign key constraint linking to `campaigns` table
    - Add index for performance on campaign_id lookups
  
  2. Storage Structure
    - Assets can now be:
      - Standalone: user_assets/{user_id}/standalone_assets/
      - Campaign-linked: user_assets/{user_id}/campaigns/{campaign_name}_{date}/
  
  3. Security
    - Maintain RLS policies
    - Allow NULL campaign_id for standalone assets
*/

-- Add campaign_id column to use_asset table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'use_asset' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE use_asset ADD COLUMN campaign_id UUID;
  END IF;
END $$;

-- Add foreign key constraint to campaigns table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'use_asset_campaign_id_fkey'
  ) THEN
    ALTER TABLE use_asset 
    ADD CONSTRAINT use_asset_campaign_id_fkey 
    FOREIGN KEY (campaign_id) 
    REFERENCES campaigns(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for campaign_id lookups
CREATE INDEX IF NOT EXISTS idx_use_asset_campaign_id ON use_asset(campaign_id);

-- Add index for user_id + campaign_id combination
CREATE INDEX IF NOT EXISTS idx_use_asset_user_campaign ON use_asset(user_id, campaign_id);

-- Ensure campaign_name remains indexed for grouping
CREATE INDEX IF NOT EXISTS idx_use_asset_campaign_name ON use_asset(campaign_name);
