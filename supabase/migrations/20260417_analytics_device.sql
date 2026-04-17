-- ─── Analytics Device & Referrer Tracking ───────────────────────────────────
-- Feature 11: add device, browser, referrer columns to magazine_read_events

alter table magazine_read_events
  add column if not exists device   text,
  add column if not exists browser  text,
  add column if not exists referrer text;

-- Indexes for audience breakdown queries
create index if not exists idx_mre_device   on magazine_read_events(device);
create index if not exists idx_mre_browser  on magazine_read_events(browser);
create index if not exists idx_mre_referrer on magazine_read_events(referrer);
