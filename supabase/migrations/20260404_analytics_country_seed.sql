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
    (row_number() over (order by first_seen_at) - 1) % 9 as slot
  from public.live_sessions
  where country_code is null
),
geo_map (slot, cc, cn) as (
  values
    (0, 'GB', 'United Kingdom'),
    (1, 'GB', 'United Kingdom'),
    (2, 'GB', 'United Kingdom'),
    (3, 'US', 'United States'),
    (4, 'US', 'United States'),
    (5, 'AE', 'United Arab Emirates'),
    (6, 'AU', 'Australia'),
    (7, 'DE', 'Germany'),
    (8, 'FR', 'France')
)
update public.live_sessions ls
set
  country_code = g.cc,
  country_name = g.cn
from ranked r
join geo_map g on g.slot = r.slot
where ls.session_id = r.session_id
  and ls.country_code is null;
