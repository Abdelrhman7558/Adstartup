-- Drop the old table if it exists (Optional, you already said you deleted it)
-- DROP TABLE IF EXISTS meta_connections;
-- Create the new table as requested
CREATE TABLE meta_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    ad_account_id TEXT,
    pixel_id TEXT,
    catalog_id TEXT,
    page_id TEXT,
    page_name TEXT,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_connected BOOLEAN DEFAULT TRUE,
    -- UNIQUE constraint is CRITICAL to prevent duplicate rows for the same user
    CONSTRAINT unique_user_connection UNIQUE (user_id)
);
-- Enable RLS
ALTER TABLE meta_connections ENABLE ROW LEVEL SECURITY;
-- Create policies
CREATE POLICY "Users can view their own meta connection" ON meta_connections FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own meta connection" ON meta_connections FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meta connection" ON meta_connections FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meta connection" ON meta_connections FOR DELETE USING (auth.uid() = user_id);