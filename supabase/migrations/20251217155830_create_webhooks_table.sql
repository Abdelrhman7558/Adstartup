/*
  # Create webhooks table for tracking webhook delivery

  1. New Tables
    - `webhooks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `event_type` (text, kill_all_ads/remove_ad/pause_ad/asset_uploaded)
      - `payload` (jsonb, webhook payload sent)
      - `target_url` (text, webhook endpoint URL)
      - `retry_count` (int, current retry count)
      - `max_retries` (int, maximum retry attempts)
      - `status` (text, pending/sent/failed/delivered)
      - `response_code` (int, HTTP response code)
      - `response_body` (text, HTTP response body)
      - `last_attempted_at` (timestamptz)
      - `sent_at` (timestamptz, successful delivery time)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `webhooks` table
    - Add policy for users to read their own webhooks

  3. Indexes
    - idx_webhooks_user_id - for user lookups
    - idx_webhooks_status - for status queries
    - idx_webhooks_created_at - for timeline queries
*/

CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  target_url text NOT NULL,
  retry_count int DEFAULT 0,
  max_retries int DEFAULT 3,
  status text DEFAULT 'pending',
  response_code int,
  response_body text,
  last_attempted_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_at ON webhooks(created_at DESC);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhooks"
  ON webhooks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert webhooks"
  ON webhooks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks"
  ON webhooks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
