/*
  # Create Clean Users and User States Tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Links to auth.users
      - `email` (text, not null) - User email
      - `phone_number` (text, nullable) - User phone number
      - `created_at` (timestamp) - Account creation timestamp
    
    - `user_states`
      - `user_id` (uuid, primary key, foreign key to users.id)
      - `current_step` (text) - Current step in user journey
      - `has_active_subscription` (boolean) - Subscription status
      - `has_completed_brief` (boolean) - Brief completion status
      - `has_connected_meta` (boolean) - Meta account connection status
      - `created_at` (timestamp) - State creation timestamp

  2. Security
    - Enable RLS on `users` table
    - Add INSERT policy for authenticated users to insert their own data
    - Add SELECT policy for users to read their own data
    - Add UPDATE policy for users to update their own data
    - Enable RLS on `user_states` table
    - Add policies for user_states table

  3. Important Notes
    - This migration safely drops existing tables and recreates them
    - RLS policies ensure users can only access their own data
    - Foreign key constraint maintains data integrity between tables
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.user_states CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  phone_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can insert own data"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own data"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create user_states table
CREATE TABLE IF NOT EXISTS public.user_states (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  current_step TEXT DEFAULT 'signed_up',
  has_active_subscription BOOLEAN DEFAULT false,
  has_completed_brief BOOLEAN DEFAULT false,
  has_connected_meta BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on user_states table
ALTER TABLE public.user_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_states table
CREATE POLICY "Users can insert own state"
  ON public.user_states
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own state"
  ON public.user_states
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own state"
  ON public.user_states
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own state"
  ON public.user_states
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);