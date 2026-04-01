-- =========================================================================
-- DATABASE MIGRATION: Add Optimization & Scaling Feature
-- =========================================================================
-- Adds a persistent boolean flag for the Optimization & Scaling 
-- toggle into both the core `campaigns` tracking table and 
-- the dashboard's `marketing_campaigns` view.

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS optimization_enabled boolean DEFAULT false;

ALTER TABLE public.marketing_campaigns 
ADD COLUMN IF NOT EXISTS optimization_enabled boolean DEFAULT false;
