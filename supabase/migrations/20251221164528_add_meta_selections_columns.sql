/*
  # Add Missing Columns to Meta Account Selections
  
  1. Changes
    - Add `brief_id` column to link selections with briefs
    - Add `webhook_submitted` to track webhook status
    - Add `webhook_response` to store webhook responses
  
  2. Notes
    - Uses IF NOT EXISTS to prevent errors if columns already exist
    - brief_id references client_briefs table
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meta_account_selections' AND column_name = 'brief_id'
  ) THEN
    ALTER TABLE meta_account_selections 
    ADD COLUMN brief_id uuid REFERENCES client_briefs(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meta_account_selections' AND column_name = 'webhook_submitted'
  ) THEN
    ALTER TABLE meta_account_selections 
    ADD COLUMN webhook_submitted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'meta_account_selections' AND column_name = 'webhook_response'
  ) THEN
    ALTER TABLE meta_account_selections 
    ADD COLUMN webhook_response jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_meta_selections_brief ON meta_account_selections(brief_id);
