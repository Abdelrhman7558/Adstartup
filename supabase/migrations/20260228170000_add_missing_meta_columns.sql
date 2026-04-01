-- Migration: Add missing columns for Meta Selection
-- Run this in Supabase Dashboard > SQL Editor if not automatically applied
-- 1. Add columns to meta_account_selections
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meta_account_selections'
        AND column_name = 'page_id'
) THEN
ALTER TABLE meta_account_selections
ADD COLUMN page_id text;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meta_account_selections'
        AND column_name = 'page_name'
) THEN
ALTER TABLE meta_account_selections
ADD COLUMN page_name text;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meta_account_selections'
        AND column_name = 'instagram_actor_id'
) THEN
ALTER TABLE meta_account_selections
ADD COLUMN instagram_actor_id text;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meta_account_selections'
        AND column_name = 'instagram_actor_name'
) THEN
ALTER TABLE meta_account_selections
ADD COLUMN instagram_actor_name text;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meta_account_selections'
        AND column_name = 'access_token'
) THEN
ALTER TABLE meta_account_selections
ADD COLUMN access_token text;
END IF;
END $$;
-- 2. Add columns to meta_connections (if missing)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meta_connections'
        AND column_name = 'instagram_actor_id'
) THEN
ALTER TABLE meta_connections
ADD COLUMN instagram_actor_id text;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'meta_connections'
        AND column_name = 'instagram_actor_name'
) THEN
ALTER TABLE meta_connections
ADD COLUMN instagram_actor_name text;
END IF;
END $$;