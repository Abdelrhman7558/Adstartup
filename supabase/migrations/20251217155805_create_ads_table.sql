/*
  # Create ads table

  1. New Tables
    - `ads`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, ad name)
      - `status` (text, active/paused/disabled/deleted)
      - `campaign_id` (text, optional)
      - `ad_account_id` (text, optional)
      - `created_by` (text, source of ad: manual/api/meta)
      - `meta_sync_status` (text, pending/synced/failed)
      - `last_synced_at` (timestamptz)
      - `metadata` (jsonb, flexible data storage)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ads` table
    - Add policy for users to read their own ads
    - Add policy for users to create their own ads
    - Add policy for users to update their own ads
    - Add policy for users to delete their own ads

  3. Indexes
    - idx_ads_user_id - for fast user lookups
    - idx_ads_status - for status filtering
    - idx_ads_created_at - for sorting by date
*/

CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  campaign_id text,
  ad_account_id text,
  created_by text NOT NULL DEFAULT 'manual',
  meta_sync_status text DEFAULT 'pending',
  last_synced_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at DESC);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ads"
  ON ads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create ads"
  ON ads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ads"
  ON ads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ads"
  ON ads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
