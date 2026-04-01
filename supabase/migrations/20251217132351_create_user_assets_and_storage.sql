/*
  # Create User Assets Table and Storage

  1. New Tables
    - `user_assets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `file_name` (text)
      - `file_type` (text)
      - `file_path` (text)
      - `file_size` (bigint, bytes)
      - `storage_bucket` (text)
      - `storage_path` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Storage
    - Create 'user-assets' bucket for file uploads
    - Enable RLS on storage bucket
    - Allow authenticated users to upload files
    - Allow users to read their own files only

  3. Security
    - Enable RLS on `user_assets` table
    - Add policies for users to manage their own assets

  4. Indexes
    - Index on user_id for fast lookups
*/

CREATE TABLE IF NOT EXISTS user_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  storage_bucket text DEFAULT 'user-assets',
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_assets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_assets_user_id ON user_assets(user_id);

CREATE POLICY "Users can read own assets"
  ON user_assets
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own assets"
  ON user_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own assets"
  ON user_assets
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own assets"
  ON user_assets
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-assets', 'user-assets', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-assets' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "Users can read own assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-assets' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "Users can update own assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-assets' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );

CREATE POLICY "Users can delete own assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-assets' AND
    (storage.foldername(name))[1] = (SELECT auth.uid()::text)
  );
