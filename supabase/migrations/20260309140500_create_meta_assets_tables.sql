-- Create local cache tables for Meta assets
-- These tables store data fetched from Meta API to improve performance
-- and avoid hitting rate limits.
CREATE TABLE IF NOT EXISTS meta_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id text NOT NULL,
    name text,
    status text,
    objective text,
    budget numeric,
    spend numeric,
    revenue numeric,
    roas numeric,
    impressions integer,
    clicks integer,
    ctr numeric,
    cpc numeric,
    cpa numeric,
    start_date timestamptz,
    end_date timestamptz,
    last_fetched_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, campaign_id)
);
CREATE TABLE IF NOT EXISTS meta_adsets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    adset_id text NOT NULL,
    campaign_id text NOT NULL,
    name text,
    status text,
    daily_budget numeric,
    lifetime_budget numeric,
    optimization_goal text,
    billing_event text,
    start_time timestamptz,
    end_time timestamptz,
    last_fetched_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, adset_id)
);
CREATE TABLE IF NOT EXISTS meta_ads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ad_id text NOT NULL,
    adset_id text NOT NULL,
    campaign_id text NOT NULL,
    name text,
    status text,
    creative_id text,
    format text,
    preview_url text,
    last_fetched_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, ad_id)
);
-- Enable RLS
ALTER TABLE meta_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_adsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_ads ENABLE ROW LEVEL SECURITY;
-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_user_id ON meta_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_campaign_id ON meta_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_adsets_user_id ON meta_adsets(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_adsets_adset_id ON meta_adsets(adset_id);
CREATE INDEX IF NOT EXISTS idx_meta_adsets_campaign_id ON meta_adsets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_user_id ON meta_ads(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_ad_id ON meta_ads(ad_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_adset_id ON meta_ads(adset_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_campaign_id ON meta_ads(campaign_id);
-- RLS Policies for meta_campaigns
CREATE POLICY "Users can read own meta campaigns" ON meta_campaigns FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can insert own meta campaigns" ON meta_campaigns FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can update own meta campaigns" ON meta_campaigns FOR
UPDATE TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
    ) WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can delete own meta campaigns" ON meta_campaigns FOR DELETE TO authenticated USING (
    user_id = (
        SELECT auth.uid()
    )
);
-- RLS Policies for meta_adsets
CREATE POLICY "Users can read own meta adsets" ON meta_adsets FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can insert own meta adsets" ON meta_adsets FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can update own meta adsets" ON meta_adsets FOR
UPDATE TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
    ) WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can delete own meta adsets" ON meta_adsets FOR DELETE TO authenticated USING (
    user_id = (
        SELECT auth.uid()
    )
);
-- RLS Policies for meta_ads
CREATE POLICY "Users can read own meta ads" ON meta_ads FOR
SELECT TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can insert own meta ads" ON meta_ads FOR
INSERT TO authenticated WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can update own meta ads" ON meta_ads FOR
UPDATE TO authenticated USING (
        user_id = (
            SELECT auth.uid()
        )
    ) WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can delete own meta ads" ON meta_ads FOR DELETE TO authenticated USING (
    user_id = (
        SELECT auth.uid()
    )
);