-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: vendor approval workflow
-- Date: 2026-04-04
-- Purpose: Adds vendor_id FK to listing_applications so approved
--          applications link to their created vendor account.
--          Adds approved_at timestamp.
--          Adds RPC for one-click admin approval flow.
-- Run in: Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Add approval tracking columns to listing_applications
alter table public.listing_applications
  add column if not exists vendor_id    uuid references public.vendors(id) on delete set null,
  add column if not exists approved_at  timestamptz,
  add column if not exists approved_by  text;  -- admin user name/email

-- Ensure vendors table has all needed columns for onboarding
alter table public.vendors
  add column if not exists application_id  uuid references public.listing_applications(id),
  add column if not exists onboarding_status text default 'pending'
    check (onboarding_status in ('pending', 'invited', 'active')),
  add column if not exists invited_at      timestamptz,
  add column if not exists tier            text default 'standard'
    check (tier in ('standard', 'featured', 'showcase'));

-- Index
create index if not exists idx_listing_applications_vendor
  on public.listing_applications(vendor_id);

create index if not exists idx_vendors_application
  on public.vendors(application_id);
