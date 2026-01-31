/*
  # Add Subscriptions and Briefs Tables

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `plan_name` (text) - Plan type (e.g., "Pro", "Enterprise")
      - `plan_price` (numeric) - Price paid
      - `payment_method` (text) - stripe/paypal/fawry
      - `payment_id` (text) - External payment ID
      - `status` (text) - active/cancelled/expired
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `briefs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `email` (text) - Confirmed email
      - `business_name` (text)
      - `website` (text)
      - `product_description` (text)
      - `target_country` (text)
      - `monthly_budget` (text)
      - `goal` (text) - Leads/Sales/Traffic/Awareness
      - `notes` (text)
      - `created_at` (timestamptz)
  
  2. Updates
    - Add `meta_connected` (boolean) to profiles table
  
  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Add meta_connected to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'meta_connected'
  ) THEN
    ALTER TABLE profiles ADD COLUMN meta_connected boolean DEFAULT false;
  END IF;
END $$;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_name text NOT NULL,
  plan_price numeric NOT NULL,
  payment_method text NOT NULL,
  payment_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create briefs table
CREATE TABLE IF NOT EXISTS briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  business_name text NOT NULL,
  website text NOT NULL,
  product_description text NOT NULL,
  target_country text NOT NULL,
  monthly_budget text NOT NULL,
  goal text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own briefs"
  ON briefs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefs"
  ON briefs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own briefs"
  ON briefs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_briefs_user_id ON briefs(user_id);