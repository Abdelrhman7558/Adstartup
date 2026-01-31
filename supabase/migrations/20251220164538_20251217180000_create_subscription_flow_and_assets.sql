/*
  # Create Subscription Flow and Assets System

  ## Overview
  Implements the complete subscription flow tracking and proper assets management system
  for the production-ready SaaS application.

  ## New Tables
  
  ### `user_flow_state`
  Tracks the user's progress through the mandatory signup flow:
  Plans → Payment → Brief → Signup → Dashboard
  
  - `user_id` (uuid, primary key) - Reference to auth.users
  - `current_step` (text) - Current step: plans, payment, brief, signup, completed
  - `has_selected_plan` (boolean) - User selected a plan
  - `selected_plan_id` (text, nullable) - Selected plan identifier
  - `has_completed_payment_ui` (boolean) - Completed payment UI (placeholder)
  - `has_submitted_brief` (boolean) - Submitted campaign brief
  - `has_completed_signup` (boolean) - Completed signup
  - `has_connected_meta` (boolean) - Connected Meta account
  - `meta_connection_step` (text, nullable) - ad_account, pixel, catalog, completed
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `workspaces`
  User workspaces for organizing projects and assets
  
  - `id` (uuid, primary key) - Unique workspace identifier
  - `user_id` (uuid) - Reference to auth.users
  - `name` (text) - Workspace name
  - `is_default` (boolean) - Default workspace for user
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `assets` (replaces user_assets)
  Proper asset management with workspace scoping
  
  - `id` (uuid, primary key) - Unique asset identifier
  - `user_id` (uuid) - Reference to auth.users (REQUIRED)
  - `workspace_id` (uuid) - Reference to workspaces (REQUIRED)
  - `asset_type` (text) - Type: image, video, copy, testimonial
  - `asset_url` (text, nullable) - File URL for media assets
  - `asset_text` (text, nullable) - Text content for copy/testimonials
  - `file_name` (text, nullable) - Original file name
  - `file_size` (bigint, nullable) - File size in bytes
  - `status` (text) - Status: uploaded, approved, rejected
  - `storage_bucket` (text, nullable) - Storage bucket name
  - `storage_path` (text, nullable) - Storage path
  - `metadata` (jsonb) - Additional metadata
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `meta_account_selections`
  Stores Meta account selections after OAuth
  
  - `id` (uuid, primary key) - Unique record identifier
  - `user_id` (uuid) - Reference to auth.users
  - `ad_account_id` (text) - Selected Meta ad account ID
  - `ad_account_name` (text, nullable) - Ad account name
  - `pixel_id` (text, nullable) - Selected pixel ID
  - `pixel_name` (text, nullable) - Pixel name
  - `catalog_id` (text, nullable) - Selected catalog ID (optional)
  - `catalog_name` (text, nullable) - Catalog name
  - `business_id` (text, nullable) - Business Manager ID
  - `selection_completed` (boolean) - All selections completed
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Comprehensive policies for all operations

  ## Indexes
  - Fast lookups by user_id
  - Workspace and asset type filtering
*/

-- Create user_flow_state table
CREATE TABLE IF NOT EXISTS user_flow_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step text NOT NULL DEFAULT 'plans' CHECK (current_step IN ('plans', 'payment', 'brief', 'signup', 'completed')),
  has_selected_plan boolean DEFAULT false,
  selected_plan_id text,
  has_completed_payment_ui boolean DEFAULT false,
  has_submitted_brief boolean DEFAULT false,
  has_completed_signup boolean DEFAULT false,
  has_connected_meta boolean DEFAULT false,
  meta_connection_step text CHECK (meta_connection_step IN ('ad_account', 'pixel', 'catalog', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create assets table (proper structure)
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  asset_type text NOT NULL CHECK (asset_type IN ('image', 'video', 'copy', 'testimonial')),
  asset_url text,
  asset_text text,
  file_name text,
  file_size bigint,
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'approved', 'rejected')),
  storage_bucket text,
  storage_path text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT asset_content_check CHECK (
    (asset_type IN ('image', 'video') AND asset_url IS NOT NULL) OR
    (asset_type IN ('copy', 'testimonial') AND asset_text IS NOT NULL)
  )
);

-- Create meta_account_selections table
CREATE TABLE IF NOT EXISTS meta_account_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_account_id text NOT NULL,
  ad_account_name text,
  pixel_id text,
  pixel_name text,
  catalog_id text,
  catalog_name text,
  business_id text,
  selection_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_flow_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_account_selections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_flow_state
CREATE POLICY "Users can view own flow state"
  ON user_flow_state FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flow state"
  ON user_flow_state FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flow state"
  ON user_flow_state FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for workspaces
CREATE POLICY "Users can view own workspaces"
  ON workspaces FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workspaces"
  ON workspaces FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workspaces"
  ON workspaces FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own workspaces"
  ON workspaces FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for assets
CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for meta_account_selections
CREATE POLICY "Users can view own meta selections"
  ON meta_account_selections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meta selections"
  ON meta_account_selections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meta selections"
  ON meta_account_selections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meta selections"
  ON meta_account_selections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_flow_state_step ON user_flow_state(user_id, current_step);
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_default ON workspaces(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_assets_user_workspace ON assets(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_assets_type_status ON assets(asset_type, status);
CREATE INDEX IF NOT EXISTS idx_meta_selections_user ON meta_account_selections(user_id);

-- Function to create default workspace for new user
CREATE OR REPLACE FUNCTION create_default_workspace()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspaces (user_id, name, is_default)
  VALUES (NEW.id, 'My Workspace', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default workspace
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_user_created_workspace'
  ) THEN
    CREATE TRIGGER on_user_created_workspace
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_default_workspace();
  END IF;
END $$;
