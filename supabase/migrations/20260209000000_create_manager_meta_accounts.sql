/*
  # Create Manager Meta Accounts Table

  1. New Tables
    - `manager_meta_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `account_id` (text, not null)
      - `account_name` (text)
      - `access_token` (text, nullable)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `manager_meta_accounts` table
    - Add policy for users to read their own accounts
    - Add policy for users to insert their own accounts (required if insertion happens with user JWT)
    - Add policy for users to delete their own accounts

  3. Indexes
    - Index on user_id for performance
*/

CREATE TABLE IF NOT EXISTS public.manager_meta_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id text NOT NULL,
    account_name text,
    access_token text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.manager_meta_accounts ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can view their own accounts
CREATE POLICY "Users can view their own manager accounts"
ON public.manager_meta_accounts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own accounts
CREATE POLICY "Users can insert their own manager accounts"
ON public.manager_meta_accounts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own accounts
CREATE POLICY "Users can delete their own manager accounts"
ON public.manager_meta_accounts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manager_meta_accounts_user_id ON public.manager_meta_accounts(user_id);
