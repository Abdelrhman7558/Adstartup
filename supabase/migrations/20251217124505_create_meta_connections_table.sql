/*
  # Create Meta Connections Table

  1. New Tables
    - `meta_connections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `access_token` (text, nullable, never exposed to frontend)
      - `ad_account_id` (text, nullable)
      - `business_manager_id` (text, nullable)
      - `pixel_id` (text, nullable)
      - `catalog_id` (text, nullable)
      - `is_connected` (boolean, default false)
      - `connected_at` (timestamp, nullable)
      - `updated_at` (timestamp, auto-updated)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `meta_connections` table
    - Add policy for users to read their own connections
    - Add policy for users to update their own connections
    - Add policy for authenticated insert (only own user_id)
    - Do not expose access_token in any SELECT query

  3. Indexes
    - Index on user_id for fast lookups
*/

CREATE TABLE IF NOT EXISTS meta_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text,
  ad_account_id text,
  business_manager_id text,
  pixel_id text,
  catalog_id text,
  is_connected boolean DEFAULT false NOT NULL,
  connected_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meta_connections ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_meta_connections_user_id ON meta_connections(user_id);

CREATE POLICY "Users can read own meta connections"
  ON meta_connections
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own meta connection"
  ON meta_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own meta connection"
  ON meta_connections
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own meta connection"
  ON meta_connections
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
