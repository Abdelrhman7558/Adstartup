/*
  # Create users_asset table for file uploads

  1. New Tables
    - `users_asset`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `file_name` (text) - original file name
      - `file_type` (text) - MIME type
      - `file_size` (integer) - size in bytes
      - `storage_path` (text) - path in Supabase Storage
      - `public_url` (text) - public URL for the file
      - `uploaded_at` (timestamp) - upload timestamp

  2. Security
    - Enable RLS on `users_asset` table
    - Add policy for users to read own files
    - Add policy for users to insert own files
    - Add policy for users to delete own files

  3. Indexes
    - Index on user_id for fast lookups
    - Index on uploaded_at for sorting
*/

CREATE TABLE IF NOT EXISTS users_asset (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  uploaded_at timestamptz DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE users_asset ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
  ON users_asset FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload own files"
  ON users_asset FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON users_asset FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_users_asset_user_id ON users_asset(user_id);
CREATE INDEX IF NOT EXISTS idx_users_asset_uploaded_at ON users_asset(uploaded_at DESC);
