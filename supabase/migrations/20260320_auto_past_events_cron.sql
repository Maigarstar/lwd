-- ─── Auto-mark events as past ─────────────────────────────────────────────────
-- Uses pg_cron to run nightly at 01:00 UTC.
-- Sets status = 'past' on any published event whose end_date (or start_date)
-- is before today. Does NOT touch cancelled or archived events.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable pg_cron extension (safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: mark overdue published events as past
CREATE OR REPLACE FUNCTION public.auto_mark_events_past()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.events
  SET
    status     = 'past',
    updated_at = NOW()
  WHERE
    status = 'published'
    AND COALESCE(end_date, start_date) < CURRENT_DATE;
$$;

-- Grant execute to postgres role (used by pg_cron)
GRANT EXECUTE ON FUNCTION public.auto_mark_events_past() TO postgres;

-- Remove existing schedule if it exists (idempotent)
SELECT cron.unschedule('auto-mark-events-past')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-mark-events-past'
);

-- Schedule: every day at 01:00 UTC
SELECT cron.schedule(
  'auto-mark-events-past',
  '0 1 * * *',
  'SELECT public.auto_mark_events_past()'
);
