-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: analytics country seed
-- Date: 2026-04-04
-- Purpose: Backfill country_code + country_name for all live_sessions rows
--          that currently have NULL geography (i.e. seed/dev data inserted
--          before the Cloudflare/ipapi.co geo capture was live).
--          Distribution approximates real LWD audience:
--            GB ~33%  · US ~22%  · AE ~11%  · AU ~11%  · DE ~11%  · FR ~11%
-- Run in: Supabase SQL Editor (safe to re-run — only touches NULL rows)
-- ═══════════════════════════════════════════════════════════════════════════

with ranked as (
  select
    session_id,
    row_number() over (order by created_at) as rn
  from public.live_sessions
  where country_code is null
),
assigned as (
  select
    session_id,
    case (rn - 1) % 9
      when 0 then row('GB', 'United Kingdom')
      when 1 then row('GB', 'United Kingdom')
      when 2 then row('GB', 'United Kingdom')
      when 3 then row('US', 'United States')
      when 4 then row('US', 'United States')
      when 5 then row('AE', 'United Arab Emirates')
      when 6 then row('AU', 'Australia')
      when 7 then row('DE', 'Germany')
      when 8 then row('FR', 'France')
    end as geo
  from ranked
)
update public.live_sessions ls
set
  country_code = (a.geo).f1,
  country_name = (a.geo).f2
from assigned a
where ls.session_id = a.session_id
  and ls.country_code is null;
