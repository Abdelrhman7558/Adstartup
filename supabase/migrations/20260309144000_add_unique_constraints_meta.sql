-- Add UNIQUE constraints to user_id to correctly support upsert() in Edge Functions
-- 1. meta_connections
ALTER TABLE meta_connections
ADD CONSTRAINT meta_connections_user_id_key UNIQUE (user_id);
-- 2. meta_account_selections (this table stores the discovered pages, ad accounts, pixels, etc. before final selection)
-- Check if table exists, if so add constraint
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'meta_account_selections'
) THEN BEGIN
ALTER TABLE meta_account_selections
ADD CONSTRAINT meta_account_selections_user_id_key UNIQUE (user_id);
EXCEPTION
WHEN duplicate_object THEN NULL;
-- Constraint already exists
END;
END IF;
END $$;