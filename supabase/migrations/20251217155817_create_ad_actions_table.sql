/*
  # Create ad_actions table for action logging

  1. New Tables
    - `ad_actions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `ad_id` (uuid, foreign key to ads)
      - `action_type` (text, kill/remove/pause/activate)
      - `action_reason` (text, reason for action)
      - `status` (text, pending/completed/failed)
      - `error_message` (text, failure reason)
      - `webhook_sent_at` (timestamptz, when webhook was sent)
      - `completed_at` (timestamptz, when action completed)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `ad_actions` table
    - Add policy for users to read their own actions
    - Add policy for users to create actions

  3. Indexes
    - idx_ad_actions_user_id - for user lookups
    - idx_ad_actions_ad_id - for ad lookups
    - idx_ad_actions_status - for status queries
    - idx_ad_actions_created_at - for timeline queries
*/

CREATE TABLE IF NOT EXISTS ad_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_id uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_reason text,
  status text DEFAULT 'pending',
  error_message text,
  webhook_sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_actions_user_id ON ad_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_actions_ad_id ON ad_actions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_actions_status ON ad_actions(status);
CREATE INDEX IF NOT EXISTS idx_ad_actions_created_at ON ad_actions(created_at DESC);

ALTER TABLE ad_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ad actions"
  ON ad_actions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create ad actions"
  ON ad_actions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ad actions"
  ON ad_actions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
