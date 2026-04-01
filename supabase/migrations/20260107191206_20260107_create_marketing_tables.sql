/*
  # Create Marketing Dashboard Tables

  1. New Tables
    - `marketing_campaigns` - Campaign metrics and data
    - `marketing_ads` - Ad metrics linked to campaigns
    - `marketing_sales_trend` - Daily sales trend data

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data

  3. Indexes
    - Performance indexes on user_id, dates, and frequently filtered fields
*/

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  campaign_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'paused', 'completed')),
  objective text,
  spend numeric NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  impressions numeric NOT NULL DEFAULT 0,
  clicks numeric NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  conversion numeric NOT NULL DEFAULT 0,
  date_start date,
  date_stop date,
  top_country text,
  top_audience_segment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own marketing campaigns"
  ON marketing_campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own marketing campaigns"
  ON marketing_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own marketing campaigns"
  ON marketing_campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own marketing campaigns"
  ON marketing_campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_marketing_campaigns_user_id ON marketing_campaigns(user_id);
CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_marketing_campaigns_date_start ON marketing_campaigns(date_start);
CREATE INDEX idx_marketing_campaigns_roas ON marketing_campaigns(roas);

CREATE TABLE IF NOT EXISTS marketing_ads (
  ad_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_name text NOT NULL,
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns(campaign_id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('active', 'paused', 'completed')),
  spend numeric NOT NULL DEFAULT 0,
  impressions numeric NOT NULL DEFAULT 0,
  clicks numeric NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  conversion numeric NOT NULL DEFAULT 0,
  top_audience_segment text,
  creative_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketing_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own marketing ads"
  ON marketing_ads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own marketing ads"
  ON marketing_ads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own marketing ads"
  ON marketing_ads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own marketing ads"
  ON marketing_ads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_marketing_ads_user_id ON marketing_ads(user_id);
CREATE INDEX idx_marketing_ads_campaign_id ON marketing_ads(campaign_id);
CREATE INDEX idx_marketing_ads_status ON marketing_ads(status);

CREATE TABLE IF NOT EXISTS marketing_sales_trend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  sales numeric NOT NULL DEFAULT 0,
  spend numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  clicks numeric,
  impressions numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE marketing_sales_trend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own marketing sales trend"
  ON marketing_sales_trend FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own marketing sales trend"
  ON marketing_sales_trend FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own marketing sales trend"
  ON marketing_sales_trend FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own marketing sales trend"
  ON marketing_sales_trend FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_marketing_sales_trend_user_id ON marketing_sales_trend(user_id);
CREATE INDEX idx_marketing_sales_trend_date ON marketing_sales_trend(date);
CREATE INDEX idx_marketing_sales_trend_user_date ON marketing_sales_trend(user_id, date);
