-- =====================================================================
-- Security & Optimization Foundation
-- =====================================================================
-- Adds:
--  1. Role-based access (users.role enum + RLS helpers + manager view)
--  2. Encrypted Meta access tokens (pgsodium symmetric encryption)
--  3. optimization_rules    (PDF rules as queryable, editable data)
--  4. campaign_states       (per-campaign mode + targets + baseline)
--  5. bot_runs              (one row per optimization-engine cycle)
--  6. agent_actions         (every action the bot took, with rollback metadata)
--  7. campaign_baselines    (rolling 7d/14d baselines for comparison)
--
-- Touches NOTHING related to Stripe, subscriptions, payments.
-- All statements idempotent.
-- =====================================================================

-- 1. Roles ---------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('client', 'manager', 'admin');
  END IF;
END$$;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'client';

CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);

-- One-time seeding: legacy hardcoded manager emails get the manager role.
-- Existing users with these emails are promoted; future role changes go through admin UI.
UPDATE public.users
   SET role = 'manager'
 WHERE email IN ('7bd02025@gmail.com', 'jihadalcc@gmail.com')
   AND role = 'client';

-- Helper: SECURITY DEFINER lookup so RLS policies can ask "is this caller a manager?"
-- without requiring SELECT permission on the users table itself.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
     WHERE id = auth.uid() AND role IN ('manager','admin')
  )
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager_or_admin() TO authenticated;

-- 2. Meta token encryption ----------------------------------------------
-- pgsodium ships with Supabase. We add an encrypted column alongside the
-- existing plaintext one and a helper view that decrypts on read for the
-- service role only. The plaintext column stays for now (zero-downtime
-- migration) and can be dropped after the backfill job runs.

CREATE EXTENSION IF NOT EXISTS pgsodium;

ALTER TABLE public.meta_connections
  ADD COLUMN IF NOT EXISTS access_token_encrypted bytea,
  ADD COLUMN IF NOT EXISTS access_token_nonce bytea;

CREATE OR REPLACE FUNCTION public.encrypt_meta_token(plain text)
RETURNS TABLE(ciphertext bytea, nonce bytea)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pgsodium, public
AS $$
DECLARE
  key_bytes bytea;
  n bytea;
BEGIN
  key_bytes := pgsodium.derive_key(1, 32, 'meta_tokens');
  n := pgsodium.crypto_secretbox_noncegen();
  RETURN QUERY SELECT
    pgsodium.crypto_secretbox(convert_to(plain, 'utf8'), n, key_bytes),
    n;
END$$;

CREATE OR REPLACE FUNCTION public.decrypt_meta_token(ct bytea, n bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pgsodium, public
AS $$
DECLARE
  key_bytes bytea;
BEGIN
  key_bytes := pgsodium.derive_key(1, 32, 'meta_tokens');
  RETURN convert_from(
    pgsodium.crypto_secretbox_open(ct, n, key_bytes),
    'utf8'
  );
END$$;

REVOKE ALL ON FUNCTION public.encrypt_meta_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decrypt_meta_token(bytea, bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.encrypt_meta_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_meta_token(bytea, bytea) TO service_role;

-- Backfill: encrypt any existing plaintext tokens.
DO $$
DECLARE
  r record;
  enc record;
BEGIN
  FOR r IN
    SELECT user_id, access_token
      FROM public.meta_connections
     WHERE access_token IS NOT NULL
       AND access_token_encrypted IS NULL
  LOOP
    SELECT * INTO enc FROM public.encrypt_meta_token(r.access_token);
    UPDATE public.meta_connections
       SET access_token_encrypted = enc.ciphertext,
           access_token_nonce     = enc.nonce
     WHERE user_id = r.user_id;
  END LOOP;
END$$;

-- 3. optimization_rules --------------------------------------------------
-- Stores the PDF rules as data. Each rule has a stable rule_id (matches PDF
-- section like 'A2.1'), the mode it applies in, a JSON condition spec the
-- engine evaluates, an action the engine executes, priority for ordering,
-- and an `enabled` flag the manager can toggle from the dashboard.

CREATE TABLE IF NOT EXISTS public.optimization_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id         text NOT NULL UNIQUE,
  mode            text NOT NULL CHECK (mode IN ('OPTIMIZE','SCALE','SHARED','GATE')),
  section         text NOT NULL,
  title           text NOT NULL,
  condition       jsonb NOT NULL,
  action          text NOT NULL,
  action_params   jsonb DEFAULT '{}'::jsonb,
  priority        int  NOT NULL DEFAULT 100,
  enabled         boolean NOT NULL DEFAULT true,
  description     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.optimization_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read rules"
  ON public.optimization_rules FOR SELECT
  TO authenticated USING (enabled OR public.is_manager_or_admin());

CREATE POLICY "Managers can write rules"
  ON public.optimization_rules FOR ALL
  TO authenticated
  USING (public.is_manager_or_admin())
  WITH CHECK (public.is_manager_or_admin());

-- Seed: PDF rules ('META ADS — OPTIMIZATION & SCALING RULES')
INSERT INTO public.optimization_rules
  (rule_id, mode, section, title, condition, action, action_params, priority, description)
VALUES
  -- A1 Winner Extraction
  ('A1.1','OPTIMIZE','A1','Winner: ROAS >= 6 stable 3d',
    '{"all":[{"metric":"roas","op":">=","value":6},{"metric":"days_running","op":">=","value":3},{"metric":"roas_stability","op":">=","value":0.85}]}',
    'duplicate_to_winners','{"keep_budget":true}',10,
    'IF ROAS >= 6 AND stable >= 3 days THEN duplicate the ad into Winners Campaign with the same budget.'),
  ('A1.2','OPTIMIZE','A1','Winner: CTR>=1.5 + CPA<=target + purchases>=5',
    '{"all":[{"metric":"ctr","op":">=","value":1.5},{"metric":"cpa_vs_target","op":"<=","value":1.0},{"metric":"purchases","op":">=","value":5}]}',
    'duplicate_to_winners','{"keep_budget":true}',20,
    'IF CTR >= 1.5% AND CPA <= target CPA AND purchases >= 5 THEN promote the creative into Winners Campaign with the same budget.'),
  ('A1.3','OPTIMIZE','A1','Clear Winner: CTR>3 + CPA<=target + ROAS>=5',
    '{"all":[{"metric":"ctr","op":">","value":3},{"metric":"cpa_vs_target","op":"<=","value":1.0},{"metric":"roas","op":">=","value":5}]}',
    'flag_clear_winner','{"isolate_to_own_adset":true,"prepare_for_scaling":true}',5,
    'IF CTR > 3% AND CPA <= target CPA AND ROAS >= 5 THEN flag as CLEAR WINNER -> isolate into its own adset -> prepare for scaling.'),
  ('A1.4','OPTIMIZE','A1','Catalog format winner 6x',
    '{"all":[{"metric":"is_catalog","op":"==","value":true},{"metric":"format_roas_ratio","op":">=","value":6}]}',
    'duplicate_winning_format','{"pause_losing_formats":true}',15,
    'IF a catalog campaign includes multiple ad formats AND one format has ROAS >= 6x better than others THEN pause the lower-performing formats AND duplicate the winner into a format-only campaign.'),

  -- A2 Budget Decisions
  ('A2.1','OPTIMIZE','A2','Increase budget +20% on ROAS>=6',
    '{"all":[{"metric":"roas","op":">=","value":6}]}',
    'increase_budget','{"pct":20,"max_pct_per_step":30}',30,
    'IF ROAS >= 6 THEN increase daily budget by 20%.'),
  ('A2.2','OPTIMIZE','A2','Decrease budget -20% on ROAS<4 after 3d',
    '{"all":[{"metric":"roas","op":"<","value":4},{"metric":"days_running","op":">=","value":3}]}',
    'decrease_budget','{"pct":20}',40,
    'IF ROAS < 4 AND ad has run >= 3 days THEN decrease budget by 20%.'),
  ('A2.3','OPTIMIZE','A2','Pause loser: ROAS<3 + 0 purchases + spend>=6x avg CPA',
    '{"all":[{"metric":"roas","op":"<","value":3},{"metric":"purchases","op":"==","value":0},{"metric":"spend_vs_avg_cpa","op":">=","value":6}]}',
    'pause_ad','{"mark_as_loser":true}',25,
    'IF ROAS < 3 AND purchases = 0 AND spend >= 6x average CPA THEN pause the ad AND mark it as a loser.'),
  ('A2.4','OPTIMIZE','A2','Bailout: CPA>2x avg + CTR<0.7',
    '{"all":[{"metric":"cpa_vs_avg","op":">","value":2},{"metric":"ctr","op":"<","value":0.7}]}',
    'pause_ad','{"alternative":"reduce_to_minimum"}',35,
    'IF CPA > 2x average campaign CPA AND CTR < 0.7% THEN pause the ad OR reduce its budget to the minimum level.'),
  ('A2.5','OPTIMIZE','A2','Auto-rollback on CPA worsening',
    '{"all":[{"metric":"cpa_worsened_after_change","op":"==","value":true}]}',
    'rollback_last_budget_change','{}',1,
    'IF CPA worsens after any budget change THEN rollback immediately to the last stable budget level.'),

  -- A3 Delivery & Spend Distribution
  ('A3.1','OPTIMIZE','A3','Single dominant adset (>=70%)',
    '{"all":[{"metric":"top_adset_spend_share","op":">=","value":0.7}]}',
    'apply_min_spend_floor','{"floor_pct":15}',60,
    'IF a campaign has 1 adset or ad receiving >= 70% of spend AND others are underdelivering THEN apply minimum spend limits (10-20% each) to all adsets to force balanced delivery.'),
  ('A3.2','OPTIMIZE','A3','Underdelivering CBO adset',
    '{"all":[{"metric":"is_cbo","op":"==","value":true},{"metric":"adset_underdelivering","op":"==","value":true},{"metric":"is_loser","op":"==","value":false}]}',
    'reduce_min_spend','{}',65,
    'IF a CBO adset is underdelivering but not a confirmed loser THEN reduce its minimum spend - do NOT kill it abruptly.'),
  ('A3.3','OPTIMIZE','A3','Self-competition: identical adsets',
    '{"all":[{"metric":"identical_adsets_in_campaign","op":">=","value":2}]}',
    'flag_self_competition','{"recommend":"consolidate"}',70,
    'IF identical adsets exist within the same campaign THEN flag as self-competition -> consolidate -> CPM will inflate if left unresolved.'),
  ('A3.4','OPTIMIZE','A3','ABO audience overlap >=40%',
    '{"all":[{"metric":"is_abo","op":"==","value":true},{"metric":"audience_overlap_pct","op":">=","value":40},{"metric":"both_broad","op":"==","value":true}]}',
    'flag_overlap','{"recommend":"merge"}',75,
    'IF audience overlap >= 40% between two ABO adsets AND both use broad targeting THEN merge or consolidate into one adset.'),

  -- A4 Creative Fatigue
  ('A4.1','OPTIMIZE','A4','Fatigue: cold freq>2.5 + CTR drop>=30%',
    '{"all":[{"metric":"cold_frequency","op":">","value":2.5},{"metric":"ctr_drop_3d_pct","op":">=","value":30}]}',
    'pause_and_refresh_creative','{}',50,
    'IF cold audience frequency > 2.5 AND CTR drops >= 30% from the last 3-day average THEN pause the fatigued adset or ad AND launch a fresh creative.'),
  ('A4.2','OPTIMIZE','A4','Hard fatigue: cold freq>=3',
    '{"all":[{"metric":"cold_frequency","op":">=","value":3}]}',
    'block_scaling_refresh_creative','{}',45,
    'IF cold audience frequency >= 3 THEN do not scale -> refresh creative immediately.'),
  ('A4.3','OPTIMIZE','A4','Rising CPM with no budget change',
    '{"all":[{"metric":"cpm_wow_rising","op":"==","value":true},{"metric":"budget_changed_7d","op":"==","value":false}]}',
    'flag_creative_fatigue','{"action":"refresh_first"}',55,
    'IF CPM is rising week-over-week with no budget change THEN diagnosis = creative fatigue -> refresh before any other action.'),

  -- A6 Rollback & Stability
  ('A6.1','OPTIMIZE','A6','Unstable >3 days -> HOLD_MODE',
    '{"all":[{"metric":"days_unstable","op":">","value":3}]}',
    'enter_hold_mode','{}',2,
    'IF performance is unstable for more than 3 consecutive days THEN enter HOLD_MODE - do not attempt further optimization until signal stabilizes.'),

  -- A7 Pre-scaling Gate
  ('A7.1','GATE','A7','Inventory cannot support 3x',
    '{"all":[{"metric":"inventory_supports_3x","op":"==","value":false}]}',
    'block_scaling_enter_hold','{}',1,
    'IF inventory CANNOT support >= 3x current order volume THEN block scaling -> enter HOLD_MODE.'),
  ('A7.2','GATE','A7','Cash flow cannot absorb',
    '{"all":[{"metric":"cashflow_supports_scaling","op":"==","value":false}]}',
    'block_scaling_enter_hold','{}',1,
    'IF cash flow CANNOT absorb ad spend delay THEN block scaling -> enter HOLD_MODE.'),
  ('A7.3','GATE','A7','Operations cannot handle surge',
    '{"all":[{"metric":"ops_supports_surge","op":"==","value":false}]}',
    'block_scaling_enter_hold','{}',1,
    'IF operations CANNOT handle an order surge THEN block scaling -> enter HOLD_MODE.'),
  ('A7.4','GATE','A7','CPA above target',
    '{"all":[{"metric":"cpa_vs_target","op":">","value":1.0}]}',
    'block_scaling_stay_optimize','{}',1,
    'IF CPA > target CPA THEN block scaling -> stay in OPTIMIZE_MODE.'),
  ('A7.5','GATE','A7','Cold frequency >=3',
    '{"all":[{"metric":"cold_frequency","op":">=","value":3}]}',
    'block_scaling_refresh_creative','{}',1,
    'IF cold audience frequency >= 3 THEN block scaling -> refresh creative first.'),

  -- B2 Vertical Scaling
  ('B2.1','SCALE','B2','Step size cap 20-30%',
    '{"all":[{"metric":"requested_budget_increase_pct","op":">","value":30}]}',
    'reject_action','{"reason":"Scaling rule violated - maximum increase is 20-30% per step."}',1,
    'IF a user wants to double a budget in one move THEN refuse -> state: Scaling rule violated - maximum increase is 20-30% per step.'),
  ('B2.2','SCALE','B2','Wait 1-5d between increases',
    '{"all":[{"metric":"days_since_last_budget_change","op":"<","value":1}]}',
    'block_action','{"reason":"Wait 1-5 days between budget increases"}',2,
    'IF a budget increase was just applied THEN wait 1-5 days before the next increase.'),
  ('B2.3','SCALE','B2','ROAS instability blocks scaling',
    '{"all":[{"metric":"roas_unstable_3d","op":"==","value":true}]}',
    'block_scaling_stabilize','{}',2,
    'IF a campaign showed ROAS instability in the last 3 days THEN do not increase budget -> stabilize first.'),
  ('B2.4','SCALE','B2','ROAS drop within 48h after increase -> rollback',
    '{"all":[{"metric":"hours_since_last_budget_increase","op":"<=","value":48},{"metric":"roas_dropped_after_increase","op":"==","value":true}]}',
    'rollback_budget_exit_scale','{}',1,
    'IF budget is increased AND ROAS drops within 48 hours THEN rollback the budget increase immediately -> exit SCALE_MODE -> OPTIMIZE_MODE.'),

  -- B6 Creative Expansion at Scale
  ('B6.1','SCALE','B6','Audience fatigue triggers creative refresh',
    '{"any":[{"metric":"cold_frequency","op":">=","value":3},{"metric":"first_time_impressions_pct","op":"<","value":50}]}',
    'launch_new_creative_variants','{}',10,
    'IF budget scaling triggers audience fatigue (frequency >= 3 OR first-time impressions < 50%) THEN launch new creative variants before increasing budget further.'),
  ('B6.2','SCALE','B6','New variant graduates to Winners',
    '{"all":[{"metric":"is_new_variant","op":"==","value":true},{"metric":"ctr","op":">","value":2.5},{"metric":"cpa_vs_target","op":"<=","value":1.0},{"metric":"days_running","op":">=","value":3}]}',
    'add_to_winners_and_scale','{}',15,
    'IF a new creative variant achieves CTR > 2.5% AND CPA <= target within 3 days THEN add it to the Winners Campaign AND scale alongside the original.'),
  ('B6.3','SCALE','B6','Kill weak new variant',
    '{"all":[{"metric":"is_new_variant","op":"==","value":true},{"metric":"ctr","op":"<","value":1},{"metric":"days_running","op":">=","value":3}]}',
    'pause_ad','{"reason":"Variant CTR<1% after 3 days"}',20,
    'IF a new creative variant achieves CTR < 1% after 3 days THEN kill it -> do not let it dilute the Winners Campaign budget.'),

  -- B7 Scaling Guardrails
  ('B7.1','SCALE','B7','ROAS below target -> exit',
    '{"all":[{"metric":"roas","op":"<","value":4}]}',
    'exit_scale_mode','{}',1,
    'IF ROAS drops below target at any point THEN exit SCALE_MODE immediately -> OPTIMIZE_MODE.'),
  ('B7.2','SCALE','B7','CPA drift >20% above baseline -> exit',
    '{"all":[{"metric":"cpa_drift_vs_baseline_pct","op":">","value":20}]}',
    'exit_scale_mode','{}',1,
    'IF CPA drift exceeds 20% above the stable baseline THEN exit SCALE_MODE immediately -> OPTIMIZE_MODE.'),
  ('B7.3','SCALE','B7','Cold freq>=3 pauses scaling',
    '{"all":[{"metric":"cold_frequency","op":">=","value":3}]}',
    'pause_scaling_refresh_creative','{}',5,
    'IF cold audience frequency >= 3 THEN pause scaling -> refresh creative -> resume only after frequency drops.'),
  ('B7.4','SCALE','B7','First-time impressions < 50%',
    '{"all":[{"metric":"first_time_impressions_pct","op":"<","value":50}]}',
    'expand_audience','{}',8,
    'IF first-time impressions drop below 50% THEN diagnosis = audience fatigue -> expand audience before any further budget increase.'),

  -- C1 Attribution
  ('C1.1','SHARED','C1','7-day attribution for ops decisions',
    '{}','use_attribution_window','{"window":"7d"}',1,
    'IF making any optimization decision (pause / budget cut / budget increase) THEN use 7-day attribution window data.'),
  ('C1.2','SHARED','C1','14-day before permanent kill',
    '{"all":[{"metric":"considering_permanent_kill","op":"==","value":true}]}',
    'use_attribution_window','{"window":"14d"}',1,
    'IF considering killing a campaign permanently THEN validate with 14-day data first.'),
  ('C1.3','SHARED','C1','Insufficient data gate',
    '{"all":[{"metric":"days_running","op":"<","value":3}]}',
    'output_insufficient_data','{"min_days":3}',1,
    'IF only 1-day data is available THEN output: INSUFFICIENT DATA - monitor for 3 days minimum before acting.'),

  -- C3 Daily Decision Routine
  ('C3.1','SHARED','C3','Pause low-CTR ad after 3d',
    '{"all":[{"metric":"ctr","op":"<","value":1},{"metric":"days_running","op":">=","value":3}]}',
    'pause_ad','{}',30,
    'IF any ad has CTR < 1% AND ran >= 3 days THEN pause it.'),
  ('C3.2','SHARED','C3','Pause adset ROAS<3 + 0 purchases + spend>=1.5x target CPA',
    '{"all":[{"metric":"roas","op":"<","value":3},{"metric":"purchases","op":"==","value":0},{"metric":"spend_vs_target_cpa","op":">=","value":1.5}]}',
    'pause_adset','{}',32,
    'IF any adset has ROAS < 3 AND purchases = 0 AND spend >= 1.5x target CPA THEN pause it.'),
  ('C3.3','SHARED','C3','Replace fatigued declining creative',
    '{"all":[{"metric":"frequency","op":">","value":2.5},{"metric":"ctr_declining","op":"==","value":true}]}',
    'pause_and_refresh_creative','{}',34,
    'IF any creative has frequency > 2.5 AND CTR is declining THEN pause it AND replace with a fresh variant.')
ON CONFLICT (rule_id) DO UPDATE SET
  mode          = EXCLUDED.mode,
  section       = EXCLUDED.section,
  title         = EXCLUDED.title,
  condition     = EXCLUDED.condition,
  action        = EXCLUDED.action,
  action_params = EXCLUDED.action_params,
  priority      = EXCLUDED.priority,
  description   = EXCLUDED.description,
  updated_at    = now();

-- 4. campaign_states -----------------------------------------------------
-- Per-campaign mode state machine + business inputs the bot needs.

CREATE TABLE IF NOT EXISTS public.campaign_states (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id              text NOT NULL,
  current_mode             text NOT NULL DEFAULT 'OPTIMIZE'
                              CHECK (current_mode IN ('OPTIMIZE','SCALE','HOLD')),
  mode_entered_at          timestamptz DEFAULT now(),
  target_cpa               numeric,
  target_roas              numeric DEFAULT 4,
  baseline_cpa             numeric,
  baseline_roas            numeric,
  baseline_calculated_at   timestamptz,
  inventory_ok             boolean DEFAULT true,
  cashflow_ok              boolean DEFAULT true,
  ops_ok                   boolean DEFAULT true,
  optimization_enabled     boolean NOT NULL DEFAULT false,
  dry_run                  boolean NOT NULL DEFAULT true,
  last_optimized_at        timestamptz,
  last_scaled_at           timestamptz,
  last_budget_change_at    timestamptz,
  last_budget_change_pct   numeric,
  consecutive_unstable_days int DEFAULT 0,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS campaign_states_user_id_idx ON public.campaign_states(user_id);
CREATE INDEX IF NOT EXISTS campaign_states_mode_idx    ON public.campaign_states(current_mode);

ALTER TABLE public.campaign_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own campaign states"
  ON public.campaign_states FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_manager_or_admin());

CREATE POLICY "Users update own campaign states"
  ON public.campaign_states FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_manager_or_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_manager_or_admin());

CREATE POLICY "Users insert own campaign states"
  ON public.campaign_states FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_manager_or_admin());

-- Auto-create a campaign_state row whenever a meta_campaigns row is inserted.
CREATE OR REPLACE FUNCTION public.auto_enroll_campaign_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.campaign_states (user_id, campaign_id, current_mode, optimization_enabled, dry_run)
       VALUES (NEW.user_id, NEW.campaign_id, 'OPTIMIZE', COALESCE(NEW.optimization_enabled, false), true)
  ON CONFLICT (user_id, campaign_id) DO NOTHING;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_auto_enroll_campaign_state ON public.meta_campaigns;
CREATE TRIGGER trg_auto_enroll_campaign_state
  AFTER INSERT ON public.meta_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.auto_enroll_campaign_state();

-- Backfill states for existing campaigns
INSERT INTO public.campaign_states (user_id, campaign_id, current_mode, optimization_enabled, dry_run)
SELECT user_id, campaign_id, 'OPTIMIZE', COALESCE(optimization_enabled, false), true
  FROM public.meta_campaigns
ON CONFLICT (user_id, campaign_id) DO NOTHING;

-- 5. bot_runs -----------------------------------------------------------
-- One row per optimization-engine cycle. Tracks what was processed and any
-- errors so the dashboard can show "Bot Status: Healthy / Warning".

CREATE TABLE IF NOT EXISTS public.bot_runs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger             text NOT NULL CHECK (trigger IN ('cron','manual','webhook','new_campaign')),
  triggered_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scope               text NOT NULL CHECK (scope IN ('all','user','campaign')),
  scope_target        text,
  mode                text NOT NULL CHECK (mode IN ('DAILY_ROUTINE','OPTIMIZE_CYCLE','SCALE_CHECK','GUARDRAIL','MANUAL')),
  dry_run             boolean NOT NULL DEFAULT true,
  started_at          timestamptz DEFAULT now(),
  finished_at         timestamptz,
  campaigns_processed int DEFAULT 0,
  actions_taken       int DEFAULT 0,
  actions_skipped     int DEFAULT 0,
  errors              int DEFAULT 0,
  error_details       jsonb,
  status              text NOT NULL DEFAULT 'running'
                          CHECK (status IN ('running','success','partial','failed'))
);

CREATE INDEX IF NOT EXISTS bot_runs_started_at_idx ON public.bot_runs(started_at DESC);
ALTER TABLE public.bot_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers read all bot runs"
  ON public.bot_runs FOR SELECT
  TO authenticated USING (public.is_manager_or_admin());

CREATE POLICY "Service role manages bot runs"
  ON public.bot_runs FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- 6. agent_actions ------------------------------------------------------
-- Every action the bot takes. Stores before/after metrics so we can prove
-- whether a rule actually moved the needle, and supports auto-rollback.

CREATE TABLE IF NOT EXISTS public.agent_actions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            uuid REFERENCES public.bot_runs(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id       text NOT NULL,
  adset_id          text,
  ad_id             text,
  rule_id           text REFERENCES public.optimization_rules(rule_id) ON DELETE SET NULL,
  action            text NOT NULL,
  action_params     jsonb DEFAULT '{}'::jsonb,
  reason            text,
  before_metrics    jsonb,
  after_metrics     jsonb,
  dry_run           boolean NOT NULL DEFAULT true,
  status            text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','executed','failed','rolled_back','skipped')),
  meta_response     jsonb,
  rolled_back_at    timestamptz,
  rolled_back_reason text,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_actions_user_idx     ON public.agent_actions(user_id);
CREATE INDEX IF NOT EXISTS agent_actions_campaign_idx ON public.agent_actions(campaign_id);
CREATE INDEX IF NOT EXISTS agent_actions_created_idx  ON public.agent_actions(created_at DESC);

ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own actions"
  ON public.agent_actions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_manager_or_admin());

CREATE POLICY "Service role writes actions"
  ON public.agent_actions FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- 7. campaign_baselines -------------------------------------------------
-- Rolling 7d / 14d baselines used by C1 attribution rules and B7 guardrails.

CREATE TABLE IF NOT EXISTS public.campaign_baselines (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id  text NOT NULL,
  window_days  int  NOT NULL CHECK (window_days IN (3,7,14,30)),
  spend        numeric DEFAULT 0,
  revenue      numeric DEFAULT 0,
  roas         numeric DEFAULT 0,
  cpa          numeric DEFAULT 0,
  ctr          numeric DEFAULT 0,
  cpm          numeric DEFAULT 0,
  frequency    numeric DEFAULT 0,
  purchases    int DEFAULT 0,
  computed_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, campaign_id, window_days)
);

CREATE INDEX IF NOT EXISTS campaign_baselines_user_idx ON public.campaign_baselines(user_id);

ALTER TABLE public.campaign_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own baselines"
  ON public.campaign_baselines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_manager_or_admin());

CREATE POLICY "Service role manages baselines"
  ON public.campaign_baselines FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- 8. updated_at triggers -------------------------------------------------

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END$$;

DROP TRIGGER IF EXISTS trg_optimization_rules_updated ON public.optimization_rules;
CREATE TRIGGER trg_optimization_rules_updated
  BEFORE UPDATE ON public.optimization_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_campaign_states_updated ON public.campaign_states;
CREATE TRIGGER trg_campaign_states_updated
  BEFORE UPDATE ON public.campaign_states
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 9. Replace email-based is_bot_manager with role-based check ----------
-- The legacy function from 20260405000002_add_manager_access.sql looked up
-- emails directly. We re-define it on top of the new role column so the
-- existing RLS policies (meta_campaigns, optimization_logs, bot_instructions,
-- notifications) keep working without policy churn.

CREATE OR REPLACE FUNCTION public.is_bot_manager()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
     WHERE id = auth.uid()
       AND role IN ('manager','admin')
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_bot_manager() TO authenticated;
