/*
  # Comprehensive Client Briefs and Active Ads System

  1. New Tables
    - `client_briefs`
      - Complete structured brief form with all 7 sections
      - Business context, offer details, marketing objectives, audience, creative direction
      - Links to user and meta selections
    
    - `active_ads`
      - Simplified ads table for dashboard display
      - Tracks profit, loss, impressions for each ad
      - Quick access for dashboard summary
  
  2. Updates
    - Add brief_id to meta_account_selections for linking
    - Add webhook tracking fields
  
  3. Security
    - Enable RLS on all new tables
    - Users can only access their own data
*/

-- Client Briefs Table (Comprehensive)
CREATE TABLE IF NOT EXISTS client_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Section 1: Business & Brand Context
  business_name text NOT NULL,
  website_url text,
  business_type text NOT NULL,
  industry_niche text NOT NULL,
  operating_countries text NOT NULL,
  selling_languages text NOT NULL,
  business_model text NOT NULL,
  business_age text NOT NULL,
  usp text NOT NULL,
  brand_tone text[] NOT NULL,
  restricted_content text NOT NULL,
  
  -- Section 2: Offer & Product Details
  advertising_what text NOT NULL,
  product_description text NOT NULL,
  currency text NOT NULL,
  aov decimal NOT NULL,
  gross_margin decimal,
  has_discount boolean DEFAULT false,
  discount_details text,
  offer_type text NOT NULL,
  payment_methods text[] NOT NULL,
  shipping_info text NOT NULL,
  refund_policy text NOT NULL,
  social_proof text[] NOT NULL,
  
  -- Section 3: Marketing Objective
  primary_goal text NOT NULL,
  secondary_goal text,
  funnel_stage text NOT NULL,
  campaign_type text NOT NULL,
  
  -- Section 4: Historical Data
  has_run_meta_ads boolean DEFAULT false,
  monthly_ad_spend text,
  best_campaign_type text,
  best_creatives text,
  best_audience_type text,
  average_cpa decimal,
  average_roas decimal,
  past_issues text,
  
  -- Section 5: Target Audience
  target_locations text NOT NULL,
  age_range text NOT NULL,
  gender text NOT NULL,
  ideal_customer text NOT NULL,
  interests_behaviors text NOT NULL,
  
  -- Section 6: Creative Direction
  preferred_angles text[] NOT NULL,
  competitors_to_avoid text,
  brand_guidelines text,
  ad_copy_tone text NOT NULL,
  
  -- Section 7: Budget & Timeline
  daily_budget decimal NOT NULL,
  risk_tolerance text NOT NULL,
  campaign_launch text NOT NULL,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Active Ads Table (For Dashboard Display)
CREATE TABLE IF NOT EXISTS active_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  ad_name text NOT NULL,
  ad_id text,
  profit decimal DEFAULT 0,
  loss decimal DEFAULT 0,
  impressions bigint DEFAULT 0,
  spend decimal DEFAULT 0,
  revenue decimal DEFAULT 0,
  
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add brief_id and webhook fields to meta_account_selections if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meta_account_selections' AND column_name = 'brief_id'
  ) THEN
    ALTER TABLE meta_account_selections ADD COLUMN brief_id uuid REFERENCES client_briefs(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meta_account_selections' AND column_name = 'webhook_submitted'
  ) THEN
    ALTER TABLE meta_account_selections ADD COLUMN webhook_submitted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meta_account_selections' AND column_name = 'webhook_response'
  ) THEN
    ALTER TABLE meta_account_selections ADD COLUMN webhook_response jsonb;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE client_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_ads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_briefs
CREATE POLICY "Users can view own briefs"
  ON client_briefs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefs"
  ON client_briefs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own briefs"
  ON client_briefs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own briefs"
  ON client_briefs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for active_ads
CREATE POLICY "Users can view own ads"
  ON active_ads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ads"
  ON active_ads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ads"
  ON active_ads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ads"
  ON active_ads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_briefs_user_id ON client_briefs(user_id);
CREATE INDEX IF NOT EXISTS idx_client_briefs_created_at ON client_briefs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_active_ads_user_id ON active_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_active_ads_status ON active_ads(status);
CREATE INDEX IF NOT EXISTS idx_active_ads_created_at ON active_ads(created_at DESC);