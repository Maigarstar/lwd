-- ── Auto Follow-Up Cron Job ──────────────────────────────────────────────────
-- Calls run-auto-follow-ups edge function every hour via pg_cron + pg_net.
-- Both extensions are enabled by default on Supabase.
--
-- HOW TO RUN:
--   1. Deploy the edge function first:
--      supabase functions deploy run-auto-follow-ups --project-ref qpkggfibwreznussudfh
--   2. Open Supabase SQL Editor and paste this file.
--   3. Replace REPLACE_WITH_SUPABASE_URL and REPLACE_WITH_SERVICE_ROLE_KEY
--      with your actual values (Project Settings → API).
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable extensions
create extension if not exists pg_cron    with schema extensions;
create extension if not exists pg_net     with schema extensions;

-- Remove existing job if re-running
do $$
begin
  if exists (select 1 from cron.job where jobname = 'run-auto-follow-ups') then
    perform cron.unschedule('run-auto-follow-ups');
  end if;
end $$;

-- Schedule: every hour at :05
-- Replace the two placeholder values below before running
select cron.schedule(
  'run-auto-follow-ups',
  '5 * * * *',
  $$
  select net.http_post(
    url     := 'REPLACE_WITH_SUPABASE_URL/functions/v1/run-auto-follow-ups',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer REPLACE_WITH_SERVICE_ROLE_KEY'
    ),
    body    := '{}'::jsonb
  ) as request_id;
  $$
);

-- Verify it was created
select jobid, jobname, schedule, active from cron.job where jobname = 'run-auto-follow-ups';
