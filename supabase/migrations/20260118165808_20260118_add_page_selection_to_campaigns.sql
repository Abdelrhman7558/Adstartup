/*
  # Add Page Selection to Campaigns Table

  This migration adds columns to store the selected page information
  for each campaign created through the New Campaign flow.

  ## Changes
  - Add `page_id` column to campaigns table
  - Add `page_name` column to campaigns table
  - Both columns are nullable to handle existing campaigns
*/

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS page_id TEXT,
ADD COLUMN IF NOT EXISTS page_name TEXT;

COMMENT ON COLUMN campaigns.page_id IS 'Meta Page ID selected for the campaign';
COMMENT ON COLUMN campaigns.page_name IS 'Meta Page Name selected for the campaign';
