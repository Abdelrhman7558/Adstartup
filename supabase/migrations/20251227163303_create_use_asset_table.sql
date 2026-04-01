/*
  # Create use_asset table for file uploads

  1. New Tables
    - `use_asset`
      - `id` (uuid, primary key)
      - `user_id` (text, references auth.users)
      - `file_name` (text)
      - `file_type` (text)
      - `file_size` (integer)
      - `storage_path` (text, unique)
      - `public_url` (text)
      - `uploaded_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `use_asset` table
    - Add policies for authenticated users to:
      - SELECT only their own files
      - INSERT only with their own user_id
      - UPDATE only their own files
      - DELETE only their own files

  3. Storage Bucket
    - Create `user_assets` bucket if not exists
    - Set as public for direct URL access
*/

-- Create use_asset table
CREATE TABLE IF NOT EXISTS use_asset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries by user_id
CREATE INDEX IF NOT EXISTS idx_use_asset_user_id ON use_asset(user_id);
CREATE INDEX IF NOT EXISTS idx_use_asset_uploaded_at ON use_asset(uploaded_at DESC);

-- Enable RLS
ALTER TABLE use_asset ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own files" ON use_asset;
DROP POLICY IF EXISTS "Users can insert own files" ON use_asset;
DROP POLICY IF EXISTS "Users can update own files" ON use_asset;
DROP POLICY IF EXISTS "Users can delete own files" ON use_asset;

-- SELECT policy: Users can only see their own files
CREATE POLICY "Users can view own files"
  ON use_asset
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- INSERT policy: Users can only insert files with their own user_id
CREATE POLICY "Users can insert own files"
  ON use_asset
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- UPDATE policy: Users can only update their own files
CREATE POLICY "Users can update own files"
  ON use_asset
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- DELETE policy: Users can only delete their own files
CREATE POLICY "Users can delete own files"
  ON use_asset
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Create storage bucket for user_assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user_assets', 'user_assets', true, null, null)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user_assets bucket
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files storage" ON storage.objects;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload own files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user_assets' AND
    (storage.foldername(name))[1] = 'user_assets' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view own files storage"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user_assets' AND
    (storage.foldername(name))[1] = 'user_assets' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow public read access to all files in user_assets bucket
CREATE POLICY "Public read access"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'user_assets');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user_assets' AND
    (storage.foldername(name))[1] = 'user_assets' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );
