/*
  # Create Meta Pages Table

  1. New Tables
    - `meta_pages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `page_id` (text, Meta page ID)
      - `page_name` (text, Meta page name)
      - `page_picture_url` (text, optional)
      - `is_selected` (boolean, whether user actively uses this page)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `meta_pages` table
    - Add policy for users to read their own pages
    - Add policy for users to update their own pages
    - Add policy for authenticated insert (only own user_id)

  3. Indexes
    - Index on user_id for fast lookups
    - Unique index on (user_id, page_id) to prevent duplicates

  4. Purpose
    - Store pages that user has selected during Meta connection
    - Pages are the source of truth for campaign creation
    - Only pages marked as selected (is_selected = true) appear in campaign wizard
*/

CREATE TABLE IF NOT EXISTS meta_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id text NOT NULL,
  page_name text NOT NULL,
  page_picture_url text,
  is_selected boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meta_pages ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_pages_user_page ON meta_pages(user_id, page_id);
CREATE INDEX IF NOT EXISTS idx_meta_pages_user_id ON meta_pages(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_pages_selected ON meta_pages(user_id, is_selected);

CREATE POLICY "Users can read own meta pages"
  ON meta_pages
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own meta pages"
  ON meta_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own meta pages"
  ON meta_pages
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own meta pages"
  ON meta_pages
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
