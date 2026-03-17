-- Managed Accounts: Portal Config
-- Adds portal_config JSONB to managed_accounts.
-- Stores the client portal menu structure (item order, enabled state, labels)
-- and account manager display info.
-- Managed from the admin Managed Accounts module.
-- Read by ClientPortal.jsx to render the correct menu for each client.
--
-- Default menu config is built in the application layer (socialStudioService.js)
-- based on the account's plan tier (signature / growth / essentials).

ALTER TABLE managed_accounts
  ADD COLUMN IF NOT EXISTS portal_config   JSONB,
  ADD COLUMN IF NOT EXISTS hero_image_url  TEXT;

-- portal_config shape:
-- {
--   "menu": [
--     { "key": "overview",    "label": "Overview",    "enabled": true,  "order": 0 },
--     { "key": "content",     "label": "Content",     "enabled": true,  "order": 1 },
--     { "key": "campaigns",   "label": "Campaigns",   "enabled": true,  "order": 2 },
--     { "key": "performance", "label": "Performance", "enabled": false, "order": 3 },
--     { "key": "brand",       "label": "Your Brand",  "enabled": true,  "order": 4 },
--     { "key": "requests",    "label": "Requests",    "enabled": false, "order": 5 },
--     { "key": "settings",    "label": "Settings",    "enabled": true,  "order": 6 }
--   ],
--   "accountManager": { "name": "", "title": "", "email": "", "photo": "" },
--   "welcomeMessage": ""
-- }
