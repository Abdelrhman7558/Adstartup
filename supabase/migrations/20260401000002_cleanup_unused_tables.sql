-- =========================================================================
-- DATABASE MIGRATION: Cleanup Unused Tables
-- =========================================================================
-- This migration removes legacy tables from early development or 
-- initial drafts that are no longer referenced in the frontend codebase.

-- Drop unused campaign iterations
DROP TABLE IF EXISTS public.meta_campaigns CASCADE;
DROP TABLE IF EXISTS public.user_campaigns CASCADE;
DROP TABLE IF EXISTS public.user_campaign_files CASCADE;
DROP TABLE IF EXISTS public.users_clean CASCADE;

-- Drop early agency/team implementation draft tables
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;

-- Drop meta_adsets (we currently bypass adsets directly or via n8n integration,
-- so this isolated table isn't called).
DROP TABLE IF EXISTS public.meta_adsets CASCADE;
