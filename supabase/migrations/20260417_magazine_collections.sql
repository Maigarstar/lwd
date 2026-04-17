-- ─── Magazine Collections (Issue Series) ────────────────────────────────────
-- Feature 8: group issues into named collections/series

create table if not exists magazine_collections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  cover_image text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Junction table: issues belong to collections
create table if not exists magazine_collection_issues (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references magazine_collections(id) on delete cascade,
  issue_id      uuid not null,
  sort_order    int  not null default 0,
  added_at      timestamptz not null default now(),
  unique (collection_id, issue_id)
);

-- Indexes
create index if not exists idx_magazine_collection_issues_collection on magazine_collection_issues(collection_id);
create index if not exists idx_magazine_collection_issues_issue      on magazine_collection_issues(issue_id);
