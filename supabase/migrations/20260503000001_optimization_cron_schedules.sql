-- Cron schedules for the optimization engine.
--
-- Three cadences mirror the AdStartup decision routine:
--   * GUARDRAIL    — every hour. Watches B7 guardrails (ROAS exit, CPA drift).
--   * DAILY_ROUTINE — daily at 06:00 UTC. C3 triage (low CTR, dead adsets, fatigue).
--   * OPTIMIZE_CYCLE — every 3 days at 06:30 UTC. Full Part A/B sweep.
--
-- The cron secret is read from the database setting `app.settings.cron_secret`,
-- which the operator MUST set once with:
--   SELECT set_config('app.settings.cron_secret', '<long random>', false);
-- The same value is set as the CRON_SECRET edge-function secret.
--
-- All jobs default to dry_run=true. Flip via UPDATE on cron.job once the operator
-- has confirmed the engine behaves correctly in shadow mode.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper: build the function URL once.
CREATE OR REPLACE FUNCTION public._optimization_engine_url()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT current_setting('app.settings.supabase_url', true) || '/functions/v1/optimization-engine'
$$;

CREATE OR REPLACE FUNCTION public._cron_call_optimization_engine(p_mode text, p_dry_run boolean)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  url text := public._optimization_engine_url();
  secret text := current_setting('app.settings.cron_secret', true);
BEGIN
  IF url IS NULL OR url = '/functions/v1/optimization-engine' THEN
    RAISE NOTICE 'app.settings.supabase_url not set; skipping cron call';
    RETURN NULL;
  END IF;
  IF secret IS NULL OR secret = '' THEN
    RAISE NOTICE 'app.settings.cron_secret not set; skipping cron call';
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || secret
    ),
    body := jsonb_build_object('mode', p_mode, 'dry_run', p_dry_run)
  ) INTO request_id;

  RETURN request_id;
END$$;

-- Remove duplicates if migration is re-run.
DO $$
BEGIN
  PERFORM cron.unschedule('opt-guardrail-hourly');
  PERFORM cron.unschedule('opt-daily-routine');
  PERFORM cron.unschedule('opt-cycle-3days');
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

-- Hourly guardrail check
SELECT cron.schedule(
  'opt-guardrail-hourly',
  '5 * * * *',
  $$ SELECT public._cron_call_optimization_engine('GUARDRAIL', true); $$
);

-- Daily routine at 06:00 UTC
SELECT cron.schedule(
  'opt-daily-routine',
  '0 6 * * *',
  $$ SELECT public._cron_call_optimization_engine('DAILY_ROUTINE', true); $$
);

-- Full optimize cycle every 3 days at 06:30 UTC
SELECT cron.schedule(
  'opt-cycle-3days',
  '30 6 */3 * *',
  $$ SELECT public._cron_call_optimization_engine('OPTIMIZE_CYCLE', true); $$
);
