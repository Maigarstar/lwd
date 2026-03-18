-- Link listings to managed accounts
-- Adds managed_account_id FK to listings so a venue/property can be
-- connected to the client it belongs to in the Managed Accounts module.
-- This enables the client portal to surface the listing and for admin
-- to see which listing(s) belong to each managed account.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS managed_account_id UUID
    REFERENCES managed_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS listings_managed_account_id_idx
  ON listings (managed_account_id);
