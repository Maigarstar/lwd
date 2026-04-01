-- Partner Accounts v2: Add business address and website URL
-- UI renamed to "Partner Accounts" but table stays as managed_accounts.
-- Plan field now stores level keys: bronze, silver, gold
-- (legacy values signature/growth/essentials still work — mapped in UI)

ALTER TABLE managed_accounts
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Index for email lookups (used in account list search)
CREATE INDEX IF NOT EXISTS idx_managed_accounts_email
  ON managed_accounts (primary_contact_email);
