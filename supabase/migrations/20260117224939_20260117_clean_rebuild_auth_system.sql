/*
  # Clean Rebuild of Authentication System
  
  ## Overview
  Complete clean rebuild from scratch
  
  ## Steps
  1. Drop ALL old tables
  2. Create fresh schema
  3. Add RLS policies
  4. Add helper functions
*/

-- Step 1: Drop ALL old tables and related objects
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS trial_tracking CASCADE;
DROP TABLE IF EXISTS user_states CASCADE;
DROP TABLE IF EXISTS user_flow_state CASCADE;
DROP TABLE IF EXISTS "Adstartup" CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS email_verification_tokens CASCADE;
DROP TABLE IF EXISTS user_briefs CASCADE;

-- Drop old triggers if exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_account ON auth.users;

-- Drop old functions if exist
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_user_account_on_signup() CASCADE;
DROP FUNCTION IF EXISTS check_and_expire_trials() CASCADE;
DROP FUNCTION IF EXISTS get_trial_days_remaining(uuid) CASCADE;
DROP FUNCTION IF EXISTS start_user_trial(uuid) CASCADE;
DROP FUNCTION IF EXISTS disconnect_user_meta(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS check_trial_expiration() CASCADE;
DROP FUNCTION IF EXISTS calculate_trial_days_remaining(uuid) CASCADE;

-- Step 2: Create fresh users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone_number text,
  
  -- Email verification
  status text DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'active', 'suspended')),
  email_verified boolean DEFAULT false,
  verified_at timestamptz,
  verified boolean DEFAULT false,
  
  -- Plan and trial
  plan_type text DEFAULT 'free' CHECK (plan_type IN ('free', 'trial', 'paid', 'starter', 'professional', 'enterprise')),
  trial_start_at timestamptz,
  trial_end_at timestamptz,
  trial_expired boolean DEFAULT false,
  
  -- Brief tracking
  brief_completed boolean DEFAULT false,
  brief_completed_at timestamptz,
  
  -- Meta connection
  meta_connected boolean DEFAULT false,
  meta_disconnected_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email verification tokens
CREATE TABLE email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create user briefs
CREATE TABLE user_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Update meta_connections (keep if exists, add columns)
DO $$
BEGIN
  -- Add missing columns if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'meta_connections') THEN
    ALTER TABLE meta_connections ADD COLUMN IF NOT EXISTS is_connected boolean DEFAULT false;
    ALTER TABLE meta_connections ADD COLUMN IF NOT EXISTS disconnect_reason text;
  ELSE
    -- Create table if doesn't exist
    CREATE TABLE meta_connections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
      meta_connected boolean DEFAULT false,
      is_connected boolean DEFAULT false,
      access_token text,
      refresh_token text,
      account_id text,
      page_id text,
      disconnected_at timestamptz,
      disconnect_reason text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Step 4: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_connections ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "tokens_select_own"
  ON email_verification_tokens FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "briefs_select_own"
  ON user_briefs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "briefs_update_own"
  ON user_briefs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "briefs_insert_own"
  ON user_briefs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "meta_select_own"
  ON meta_connections FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "meta_update_own"
  ON meta_connections FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "meta_insert_own"
  ON meta_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Step 6: Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_plan_type ON users(plan_type);
CREATE INDEX idx_users_trial_end ON users(trial_end_at);
CREATE INDEX idx_email_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX idx_meta_connections_user ON meta_connections(user_id);

-- Step 7: Auto-create user function
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, status, email_verified, verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending_verification',
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-create
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 8: Helper functions
CREATE FUNCTION check_and_expire_trials()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    trial_expired = true,
    plan_type = 'free',
    updated_at = now()
  WHERE 
    plan_type = 'trial'
    AND trial_end_at < now()
    AND trial_expired = false;
  
  UPDATE meta_connections mc
  SET 
    meta_connected = false,
    is_connected = false,
    disconnected_at = now(),
    disconnect_reason = 'trial_expired',
    updated_at = now()
  FROM users u
  WHERE 
    mc.user_id = u.id
    AND u.trial_expired = true
    AND (mc.meta_connected = true OR mc.is_connected = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION get_trial_days_remaining(user_uuid uuid)
RETURNS integer AS $$
DECLARE
  days_remaining integer;
BEGIN
  SELECT 
    GREATEST(0, EXTRACT(DAY FROM (trial_end_at - now()))::integer)
  INTO days_remaining
  FROM users
  WHERE id = user_uuid
    AND plan_type = 'trial'
    AND trial_expired = false;
  
  RETURN COALESCE(days_remaining, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION start_user_trial(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    plan_type = 'trial',
    trial_start_at = now(),
    trial_end_at = now() + interval '14 days',
    trial_expired = false,
    updated_at = now()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE FUNCTION disconnect_user_meta(user_uuid uuid, reason text DEFAULT 'manual')
RETURNS void AS $$
BEGIN
  UPDATE meta_connections
  SET 
    meta_connected = false,
    is_connected = false,
    disconnected_at = now(),
    disconnect_reason = reason,
    access_token = NULL,
    refresh_token = NULL,
    updated_at = now()
  WHERE user_id = user_uuid;
  
  UPDATE users
  SET 
    meta_connected = false,
    meta_disconnected_at = now(),
    updated_at = now()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
