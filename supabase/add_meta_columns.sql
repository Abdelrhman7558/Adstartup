-- Add Meta API ID columns to campaigns table
-- Run this in Supabase Dashboard > SQL Editor
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS meta_campaign_id TEXT;
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS meta_adset_id TEXT;
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS meta_creative_id TEXT;
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS meta_ad_id TEXT;