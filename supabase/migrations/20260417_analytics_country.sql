-- Add country column to magazine_read_events
alter table magazine_read_events add column if not exists country text;
create index if not exists idx_mre_country on magazine_read_events(country);
