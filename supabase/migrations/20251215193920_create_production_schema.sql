/*
  # Production Schema for Adstartup SaaS Platform

  1. New Tables
    - `users`
      - `id` (uuid, foreign key to auth.users)
      - `email` (text)
      - `phone_number` (text)
      - `created_at` (timestamptz)
    
    - `user_states`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `current_step` (text) - Values: signed_up, subscribed, brief_completed, meta_connected, active
      - `has_active_subscription` (boolean)
      - `has_completed_brief` (boolean)
      - `has_connected_meta` (boolean)
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `subscription_id` (uuid, foreign key to subscriptions)
      - `amount` (numeric)
      - `provider` (text) - stripe/paypal/fawry
      - `status` (text) - pending/completed/failed
      - `paid_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `meta_connections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `access_token` (text) - encrypted
      - `ad_account_id` (text)
      - `business_manager_id` (text)
      - `pixel_id` (text)
      - `catalog_id` (text)
      - `is_connected` (boolean)
      - `connected_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Updates
    - Update subscriptions table with plan_id and expires_at
    - Update briefs table renamed to campaign_briefs
  
  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  phone_number text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create user_states table
CREATE TABLE IF NOT EXISTS user_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_step text NOT NULL DEFAULT 'signed_up',
  has_active_subscription boolean DEFAULT false,
  has_completed_brief boolean DEFAULT false,
  has_connected_meta boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own state"
  ON user_states FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own state"
  ON user_states FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own state"
  ON user_states FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create meta_connections table
CREATE TABLE IF NOT EXISTS meta_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token text,
  ad_account_id text,
  business_manager_id text,
  pixel_id text,
  catalog_id text,
  is_connected boolean DEFAULT false,
  connected_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meta_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meta connections"
  ON meta_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meta connections"
  ON meta_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meta connections"
  ON meta_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_id text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN started_at timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

-- Rename briefs to campaign_briefs if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'briefs'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'campaign_briefs'
  ) THEN
    ALTER TABLE briefs RENAME TO campaign_briefs;
  END IF;
END $$;

-- Create campaign_briefs if it doesn't exist
CREATE TABLE IF NOT EXISTS campaign_briefs (
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_briefs' AND policyname = 'Users can view own briefs'
  ) THEN
    ALTER TABLE campaign_briefs ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own briefs"
      ON campaign_briefs FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own briefs"
      ON campaign_briefs FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own briefs"
      ON campaign_briefs FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_states_user_id ON user_states(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_connections_user_id ON meta_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_user_id ON campaign_briefs(user_id);