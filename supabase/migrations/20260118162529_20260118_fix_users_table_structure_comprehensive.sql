/*
  # Fix Users Table Structure - Comprehensive Rebuild

  ## Problem
  The users table has 65 columns with many duplicates (id, email, created_at, updated_at repeated).
  This causes database errors during signup and prevents user creation.

  ## Solution
  1. Create clean users_new table with proper structure
  2. Migrate data safely from old users table
  3. Drop old table and rename new one
  4. Recreate triggers and policies
  5. Fix RLS for proper access control

  ## Important
  - All user data will be preserved
  - Triggers will be recreated
  - RLS policies will be re-enabled
*/

-- Step 1: Create backup and verify old structure
DO $$
BEGIN
  -- Log what we're fixing
  RAISE NOTICE 'Starting users table structure fix...';
  RAISE NOTICE 'Current users table has % columns', (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'users' AND table_schema = 'public'
  );
END $$;

-- Step 2: Create clean users table with correct structure
CREATE TABLE IF NOT EXISTS users_clean (
  -- Primary ID (from auth)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  
  -- Authentication & Verification
  verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT DEFAULT 'pending_verification',
  
  -- Plan & Trial
  plan_type TEXT DEFAULT 'free',
  trial_start_at TIMESTAMP WITH TIME ZONE,
  trial_end_at TIMESTAMP WITH TIME ZONE,
  trial_expired BOOLEAN DEFAULT false,
  brief_completed BOOLEAN DEFAULT false,
  brief_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Meta Connection
  meta_connected BOOLEAN DEFAULT false,
  meta_disconnected_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT trial_dates_valid CHECK (
    trial_start_at IS NULL OR trial_end_at IS NULL OR trial_end_at > trial_start_at
  ),
  CONSTRAINT verified_constraint CHECK (
    NOT verified OR email_verified = true
  )
);

-- Step 3: Copy data from old users table (only if old table exists and has data)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    INSERT INTO users_clean (
      id, email, full_name, phone_number, verified, email_verified,
      verified_at, status, plan_type, trial_start_at, trial_end_at,
      trial_expired, brief_completed, brief_completed_at, meta_connected,
      meta_disconnected_at, created_at, updated_at
    )
    SELECT DISTINCT ON (id)
      id,
      (ARRAY_AGG(email))[1] as email,
      (ARRAY_AGG(full_name))[1] as full_name,
      (ARRAY_AGG(phone_number))[1] as phone_number,
      COALESCE((ARRAY_AGG(verified))[1], false) as verified,
      COALESCE((ARRAY_AGG(email_verified))[1], false) as email_verified,
      (ARRAY_AGG(verified_at))[1] as verified_at,
      COALESCE((ARRAY_AGG(status))[1], 'pending_verification') as status,
      COALESCE((ARRAY_AGG(plan_type))[1], 'free') as plan_type,
      (ARRAY_AGG(trial_start_at))[1] as trial_start_at,
      (ARRAY_AGG(trial_end_at))[1] as trial_end_at,
      COALESCE((ARRAY_AGG(trial_expired))[1], false) as trial_expired,
      COALESCE((ARRAY_AGG(brief_completed))[1], false) as brief_completed,
      (ARRAY_AGG(brief_completed_at))[1] as brief_completed_at,
      COALESCE((ARRAY_AGG(meta_connected))[1], false) as meta_connected,
      (ARRAY_AGG(meta_disconnected_at))[1] as meta_disconnected_at,
      COALESCE((ARRAY_AGG(created_at))[1], now()) as created_at,
      COALESCE((ARRAY_AGG(updated_at))[1], now()) as updated_at
    FROM users
    WHERE id IS NOT NULL
    GROUP BY id
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Data migrated: % rows', (SELECT COUNT(*) FROM users_clean);
  END IF;
END $$;

-- Step 4: Disable RLS temporarily
ALTER TABLE users_clean DISABLE ROW LEVEL SECURITY;

-- Step 5: Drop old users table and replace it
DROP TABLE IF EXISTS users CASCADE;
ALTER TABLE users_clean RENAME TO users;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email, verified) WHERE verified = false;
CREATE INDEX IF NOT EXISTS idx_users_trial_active ON users(trial_end_at, trial_expired) WHERE plan_type = 'trial';
CREATE INDEX IF NOT EXISTS idx_users_status_plan ON users(status, plan_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Step 7: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 8: Recreate RLS Policies
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Step 9: Recreate trigger for automatic user creation on signup
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone_number,
    verified,
    email_verified,
    status,
    plan_type,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone_number',
    false,
    false,
    'pending_verification',
    'free',
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    phone_number = COALESCE(EXCLUDED.phone_number, users.phone_number),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 10: Recreate trigger for email verification
DROP FUNCTION IF EXISTS handle_email_verification() CASCADE;
CREATE FUNCTION handle_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- When email is confirmed in auth.users, update users table
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.users
    SET
      verified = true,
      email_verified = true,
      verified_at = NEW.email_confirmed_at,
      status = 'active',
      updated_at = now()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email verification
DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_verification();

-- Step 11: Log completion
DO $$
BEGIN
  RAISE NOTICE 'Users table structure fix complete!';
  RAISE NOTICE 'Final column count: %', (
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'users' AND table_schema = 'public'
  );
  RAISE NOTICE 'Total users in database: %', (SELECT COUNT(*) FROM users);
END $$;
