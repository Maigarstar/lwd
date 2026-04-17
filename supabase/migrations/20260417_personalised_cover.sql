-- Add cover_url column to magazine_personalised_issues
alter table magazine_personalised_issues add column if not exists cover_url text;
