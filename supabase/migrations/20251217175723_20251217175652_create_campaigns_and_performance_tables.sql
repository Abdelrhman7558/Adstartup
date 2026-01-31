/*
  # Create Campaigns and Ads Performance Tables

  ## Overview
  Creates tables to track advertising campaigns and their performance metrics for the dashboard.

  ## New Tables
  
  ### `campaigns`
  - `id` (uuid, primary key) - Unique campaign identifier
  - `user_id` (uuid) - Reference to auth.users
  - `name` (text) - Campaign name
  - `status` (text) - Campaign status: active, paused, completed
  - `meta_campaign_id` (text, nullable) - Meta platform campaign ID
  - `ad_account_id` (text, nullable) - Meta ad account ID
  - `objective` (text, nullable) - Campaign objective (awareness, traffic, conversions, etc.)
  - `budget` (numeric, nullable) - Campaign budget
  - `spend` (numeric, default 0) - Total amount spent
  - `start_date` (timestamptz) - Campaign start date
  - `end_date` (timestamptz, nullable) - Campaign end date
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `ads_performance`
  - `id` (uuid, primary key) - Unique performance record identifier
  - `user_id` (uuid) - Reference to auth.users
  - `ad_id` (uuid, nullable) - Reference to ads table
  - `campaign_id` (uuid, nullable) - Reference to campaigns table
  - `date` (date) - Performance date
  - `impressions` (bigint, default 0) - Number of impressions
  - `clicks` (bigint, default 0) - Number of clicks
  - `spend` (numeric, default 0) - Amount spent
  - `revenue` (numeric, default 0) - Revenue generated
  - `conversions` (integer, default 0) - Number of conversions
  - `ctr` (numeric, nullable) - Click-through rate (%)
  - `cpc` (numeric, nullable) - Cost per click
  - `cpm` (numeric, nullable) - Cost per thousand impressions
  - `cpa` (numeric, nullable) - Cost per acquisition
  - `roas` (numeric, nullable) - Return on ad spend
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own campaigns and performance data
  - Policies for SELECT, INSERT, UPDATE, DELETE operations

  ## Indexes
  - Index on user_id for fast user-specific queries
  - Index on date for performance trend analysis
  - Composite index on (user_id, status) for active campaign queries
*/

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'draft')),
  meta_campaign_id text,
  ad_account_id text,
  objective text,
  budget numeric,
  spend numeric DEFAULT 0,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ads_performance table
CREATE TABLE IF NOT EXISTS ads_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id uuid REFERENCES ads(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  spend numeric DEFAULT 0,
  revenue numeric DEFAULT 0,
  conversions integer DEFAULT 0,
  ctr numeric,
  cpc numeric,
  cpm numeric,
  cpa numeric,
  roas numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_performance ENABLE ROW LEVEL SECURITY;

-- Campaigns RLS Policies
CREATE POLICY "Users can view own campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Ads Performance RLS Policies
CREATE POLICY "Users can view own performance data"
  ON ads_performance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own performance data"
  ON ads_performance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own performance data"
  ON ads_performance FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own performance data"
  ON ads_performance FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_status ON campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_date ON campaigns(start_date DESC);

CREATE INDEX IF NOT EXISTS idx_ads_performance_user_id ON ads_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_performance_date ON ads_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_ads_performance_user_date ON ads_performance(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ads_performance_campaign_id ON ads_performance(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_performance_ad_id ON ads_performance(ad_id);
