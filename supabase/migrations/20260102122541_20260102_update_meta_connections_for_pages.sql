/*
  # Update meta_connections table to store page selections

  1. Changes
    - Add page_id column if not exists
    - Add page_name column if not exists
    - Add catalog_name column if not exists

  2. Purpose
    - Store user's selected Meta Page
    - Store user's selected Catalog name
    - Source of truth for campaign source data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meta_connections' AND column_name = 'page_id'
  ) THEN
    ALTER TABLE meta_connections ADD COLUMN page_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meta_connections' AND column_name = 'page_name'
  ) THEN
    ALTER TABLE meta_connections ADD COLUMN page_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meta_connections' AND column_name = 'catalog_name'
  ) THEN
    ALTER TABLE meta_connections ADD COLUMN catalog_name text;
  END IF;
END $$;
