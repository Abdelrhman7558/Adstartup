/*
  # Fix Database Indexes and Performance

  1. Missing Indexes
    - Add index for `payments.user_id` foreign key (improves JOIN and DELETE performance)

  2. Remove Unused Indexes
    - Drop indexes that are not being used by queries
    - Reduces storage overhead and improves write performance
    - Unused indexes:
      - `idx_campaign_briefs_user_id`
      - `idx_payments_subscription_id`
      - `idx_subscriptions_user_status`
      - `idx_user_states_user_id`
      - `idx_meta_connections_user_id`
      - `idx_profiles_id`
      - `idx_adstartup_email`

  3. Important Notes
    - Foreign key indexes are critical for query performance
    - Unused indexes waste storage and slow down INSERT/UPDATE/DELETE operations
    - RLS policies on Adstartup table already use subquery pattern (optimized)
*/

-- =====================================================
-- STEP 1: Add Missing Foreign Key Index
-- =====================================================

-- Add index for payments.user_id to improve query performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- =====================================================
-- STEP 2: Remove Unused Indexes
-- =====================================================

-- Drop unused indexes to reduce storage and improve write performance
DROP INDEX IF EXISTS public.idx_campaign_briefs_user_id;
DROP INDEX IF EXISTS public.idx_payments_subscription_id;
DROP INDEX IF EXISTS public.idx_subscriptions_user_status;
DROP INDEX IF EXISTS public.idx_user_states_user_id;
DROP INDEX IF EXISTS public.idx_meta_connections_user_id;
DROP INDEX IF EXISTS public.idx_profiles_id;
DROP INDEX IF EXISTS public.idx_adstartup_email;

-- =====================================================
-- STEP 3: Verification
-- =====================================================

-- Log remaining indexes for verification
DO $$
DECLARE
  idx_record RECORD;
  idx_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== Active Database Indexes ===';
  
  FOR idx_record IN 
    SELECT 
      schemaname, 
      tablename, 
      indexname,
      indexdef
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
    ORDER BY tablename, indexname
  LOOP
    idx_count := idx_count + 1;
    RAISE NOTICE 'Table: % | Index: %', idx_record.tablename, idx_record.indexname;
  END LOOP;
  
  IF idx_count = 0 THEN
    RAISE NOTICE 'No custom indexes found (all cleaned up)';
  ELSE
    RAISE NOTICE 'Total custom indexes: %', idx_count;
  END IF;
  
  RAISE NOTICE '=== Index Optimization Complete ===';
END $$;
