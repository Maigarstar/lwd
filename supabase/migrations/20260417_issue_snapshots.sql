-- ─── Magazine Issue Snapshots (Version History) ──────────────────────────────
-- Feature 12: store up to 10 snapshots per issue for version history

create table if not exists magazine_issue_snapshots (
  id            uuid primary key default gen_random_uuid(),
  issue_id      uuid not null,
  label         text,
  snapshot_data jsonb not null default '[]',
  created_at    timestamptz not null default now()
);

create index if not exists idx_magazine_issue_snapshots_issue on magazine_issue_snapshots(issue_id);
create index if not exists idx_magazine_issue_snapshots_ts    on magazine_issue_snapshots(issue_id, created_at desc);
