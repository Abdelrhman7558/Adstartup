/*
  # Security Fixes: Indexes and RLS Optimization

  ## Summary
  This migration fixes security and performance issues flagged by Supabase advisors.

  ## Changes Made

  ### 1. New Indexes for Foreign Keys
  Adding indexes on foreign key columns to improve query performance:
  - `campaign_briefs.user_id` - Index for user lookups
  - `subscriptions.user_id` - Index for subscription queries by user
  - `payments.subscription_id` - Index for payment lookups by subscription

  ### 2. RLS Policy Optimization for Adstartup Table
  Recreating RLS policies with proper `(SELECT auth.uid())` pattern to prevent
  re-evaluation of auth functions for each row.

  ## Security Notes
  - All policies use `TO authenticated` to restrict access to logged-in users only
  - Policies use subquery pattern `(SELECT auth.uid())` for optimal performance
*/

-- ============================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================

-- Index on campaign_briefs.user_id (foreign key to auth.users)
CREATE INDEX IF NOT EXISTS idx_campaign_briefs_user_id 
ON public.campaign_briefs (user_id);

-- Index on subscriptions.user_id (foreign key to auth.users)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
ON public.subscriptions (user_id);

-- Index on payments.subscription_id (foreign key to subscriptions)
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id 
ON public.payments (subscription_id);

-- ============================================
-- 2. OPTIMIZE ADSTARTUP RLS POLICIES
-- ============================================

-- Drop existing policies on Adstartup table
DROP POLICY IF EXISTS "Users can view own adstartup data" ON public."Adstartup";
DROP POLICY IF EXISTS "Users can insert own adstartup data" ON public."Adstartup";
DROP POLICY IF EXISTS "Users can update own adstartup data" ON public."Adstartup";
DROP POLICY IF EXISTS "Users can delete own adstartup data" ON public."Adstartup";

-- Recreate with optimized auth function calls using subquery pattern
-- Note: Using email matching since this table uses email as identifier

CREATE POLICY "Users can view own adstartup data"
ON public."Adstartup"
FOR SELECT
TO authenticated
USING (email = (SELECT (auth.jwt() ->> 'email')));

CREATE POLICY "Users can insert own adstartup data"
ON public."Adstartup"
FOR INSERT
TO authenticated
WITH CHECK (email = (SELECT (auth.jwt() ->> 'email')));

CREATE POLICY "Users can update own adstartup data"
ON public."Adstartup"
FOR UPDATE
TO authenticated
USING (email = (SELECT (auth.jwt() ->> 'email')))
WITH CHECK (email = (SELECT (auth.jwt() ->> 'email')));

CREATE POLICY "Users can delete own adstartup data"
ON public."Adstartup"
FOR DELETE
TO authenticated
USING (email = (SELECT (auth.jwt() ->> 'email')));
