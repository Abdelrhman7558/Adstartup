/*
  # Create Trial Tracking Table

  1. New Tables
    - `trial_tracking`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `trial_start_date` (timestamptz)
      - `trial_end_date` (timestamptz)
      - `trial_status` (text: active/expired)
      - `total_spend` (numeric)
      - `total_revenue` (numeric)
      - `total_campaigns` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on trial_tracking table
    - Users can only view their own trial data
    - Only authenticated users can access

  3. Indexes
    - Index on user_id for fast lookups
    - Index on trial_status for filtering
*/

-- Create trial_tracking table
CREATE TABLE IF NOT EXISTS trial_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ NOT NULL,
  trial_status TEXT NOT NULL DEFAULT 'active',
  total_spend NUMERIC NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  total_campaigns INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trial_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own trial data"
  ON trial_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trial data"
  ON trial_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trial data"
  ON trial_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trial_tracking_user_id ON trial_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_tracking_status ON trial_tracking(trial_status);
CREATE INDEX IF NOT EXISTS idx_trial_tracking_end_date ON trial_tracking(trial_end_date);

-- Add constraint to ensure only one trial per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_trial_tracking_user_unique ON trial_tracking(user_id);
