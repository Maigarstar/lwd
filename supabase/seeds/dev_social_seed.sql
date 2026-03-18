-- dev_social_seed.sql
-- Dev bootstrap data: campaigns and content items for the 4 seeded managed accounts.
-- Safe to rerun: all inserts use ON CONFLICT DO NOTHING with stable UUIDs.
-- Do not use these UUIDs in production. These are dev environment only.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Campaigns ────────────────────────────────────────────────────────────────
-- Villa d'Este (signature)
INSERT INTO social_campaigns (id, managed_account_id, name, description, status, start_date, end_date, sort_order) VALUES
  ('c0000001-0001-0000-0000-000000000001', 'a1b2c3d4-0001-0000-0000-000000000001', 'Spring Season Launch',  'Lake Como spring opening campaign targeting UK and US couples.', 'active',   '2026-03-01', '2026-04-30', 1),
  ('c0000001-0001-0000-0000-000000000002', 'a1b2c3d4-0001-0000-0000-000000000001', 'Summer Availability',   'Summer date availability and early-bird enquiry push.',         'active',   '2026-05-01', '2026-07-31', 2),
  ('c0000001-0001-0000-0000-000000000003', 'a1b2c3d4-0001-0000-0000-000000000001', 'Autumn Editorial 2025', 'Post-season editorial archive and best-of content.',            'complete', '2025-10-01', '2025-11-30', 3)
ON CONFLICT (id) DO NOTHING;

-- Belmond Villa San Michele (signature)
INSERT INTO social_campaigns (id, managed_account_id, name, description, status, start_date, end_date, sort_order) VALUES
  ('c0000002-0001-0000-0000-000000000001', 'a1b2c3d4-0002-0000-0000-000000000002', 'Fiesole Terrace Series', 'Hero imagery series from the signature terrace ceremony space.', 'active',   '2026-03-15', '2026-05-15', 1),
  ('c0000002-0001-0000-0000-000000000002', 'a1b2c3d4-0002-0000-0000-000000000002', 'Honeymoon Suite Push',   'Targeting post-engagement couples searching for intimate stays.', 'paused',   '2026-02-01', '2026-02-28', 2)
ON CONFLICT (id) DO NOTHING;

-- Borgo Egnazia (growth)
INSERT INTO social_campaigns (id, managed_account_id, name, description, status, start_date, end_date, sort_order) VALUES
  ('c0000003-0001-0000-0000-000000000001', 'a1b2c3d4-0003-0000-0000-000000000003', 'Puglia Season 2026', 'Full-season campaign anchored by venue editorial and real weddings.', 'active', '2026-04-01', '2026-09-30', 1)
ON CONFLICT (id) DO NOTHING;

-- ── Content items ─────────────────────────────────────────────────────────────
-- Villa d'Este content pipeline (mix of statuses across both active campaigns)

INSERT INTO social_content (id, managed_account_id, campaign_id, campaign_name, title, type, platform, status, publish_date, assigned_to) VALUES

  -- Spring Season Launch content
  ('d0000001-0001-0000-0000-000000000001', 'a1b2c3d4-0001-0000-0000-000000000001', 'c0000001-0001-0000-0000-000000000001', 'Spring Season Launch', 'Villa d''Este Opens for the Season',        'post',  'instagram', 'live',      '2026-03-01', 'Team LWD'),
  ('d0000001-0001-0000-0000-000000000002', 'a1b2c3d4-0001-0000-0000-000000000001', 'c0000001-0001-0000-0000-000000000001', 'Spring Season Launch', 'Lakeside Ceremony Reel',                    'reel',  'instagram', 'live',      '2026-03-08', 'Team LWD'),
  ('d0000001-0001-0000-0000-000000000003', 'a1b2c3d4-0001-0000-0000-000000000001', 'c0000001-0001-0000-0000-000000000001', 'Spring Season Launch', 'The Boathouse - Intimate Wedding Feature',  'blog',  'web',       'live',      '2026-03-12', 'Team LWD'),
  ('d0000001-0001-0000-0000-000000000004', 'a1b2c3d4-0001-0000-0000-000000000001', 'c0000001-0001-0000-0000-000000000001', 'Spring Season Launch', 'Spring Availability Carousel',              'post',  'instagram', 'scheduled', '2026-03-25', 'Team LWD'),
  ('d0000001-0001-0000-0000-000000000005', 'a1b2c3d4-0001-0000-0000-000000000001', 'c0000001-0001-0000-0000-000000000001', 'Spring Season Launch', 'April Dates Still Available',               'post',  'facebook',  'scheduled', '2026-03-28', 'Team LWD'),
  ('d0000001-0001-0000-0000-000000000006', 'a1b2c3d4-0001-0000-0000-000000000001', 'c0000001-0001-0000-0000-000000000001', 'Spring Season Launch', 'Garden Terrace Sunset Editorial',           'reel',  'instagram', 'approved',  '2026-04-03', 'Team LWD'),
  ('d0000001-0001-0000-0000-000000000007', 'a1b2c3d4-0001-0000-0000-000000000001', 'c0000001-0001-0000-0000-000000000001', 'Spring Season Launch', 'Venue Tour Video',                          'reel',  'instagram', 'review',    '2026-04-10', 'Team LWD'),
  ('d0000001-0001-0000-0000-000000000008', 'a1b2c3d4-0001-0000-0000-000000000001', 'c0000001-0001-0000-0000-000000000001', 'Spring Season Launch', 'Pinterest Board Refresh',                   'post',  'pinterest', 'draft',     '2026-04-15', 'Team LWD'),
  ('d0000001-0001-0000-0000-000000000009', 'a1b2c3d4-0001-0000-0000-000000000001', 'c0000001-0001-0000-0000-000000000001', 'Spring Season Launch', 'Spring Newsletter Feature',                 'newsletter', 'email', 'draft',    '2026-04-18', 'Team LWD'),
  ('d0000001-0001-0000-0000-000000000010', 'a1b2c3d4-0001-0000-0000-000000000001', 'c0000001-0001-0000-0000-000000000001', 'Spring Season Launch', 'Organic Blog: Marrying on Lake Como',      'blog',  'web',       'brief',     NULL,         'Team LWD'),

  -- Summer Availability content (early pipeline)
  ('d0000001-0002-0000-0000-000000000001', 'a1b2c3d4-0001-0000-0000-000000000001', 'c0000001-0001-0000-0000-000000000002', 'Summer Availability',  'Summer Dates - First Release',              'post',  'instagram', 'brief',     '2026-05-02', 'Team LWD'),
  ('d0000001-0002-0000-0000-000000000002', 'a1b2c3d4-0001-0000-0000-000000000001', 'c0000001-0001-0000-0000-000000000002', 'Summer Availability',  'August Saturday Availability Alert',        'post',  'instagram', 'brief',     '2026-05-09', 'Team LWD')

ON CONFLICT (id) DO NOTHING;

-- Belmond Villa San Michele content
INSERT INTO social_content (id, managed_account_id, campaign_id, campaign_name, title, type, platform, status, publish_date, assigned_to) VALUES
  ('d0000002-0001-0000-0000-000000000001', 'a1b2c3d4-0002-0000-0000-000000000002', 'c0000002-0001-0000-0000-000000000001', 'Fiesole Terrace Series', 'Terrace Ceremony - Golden Hour',           'reel',  'instagram', 'live',      '2026-03-05', 'Team LWD'),
  ('d0000002-0001-0000-0000-000000000002', 'a1b2c3d4-0002-0000-0000-000000000002', 'c0000002-0001-0000-0000-000000000001', 'Fiesole Terrace Series', 'Fiesole Hillside Editorial',               'post',  'instagram', 'live',      '2026-03-10', 'Team LWD'),
  ('d0000002-0001-0000-0000-000000000003', 'a1b2c3d4-0002-0000-0000-000000000002', 'c0000002-0001-0000-0000-000000000001', 'Fiesole Terrace Series', 'Ceremony Space Walkaround',                'reel',  'instagram', 'scheduled', '2026-03-22', 'Team LWD'),
  ('d0000002-0001-0000-0000-000000000004', 'a1b2c3d4-0002-0000-0000-000000000002', 'c0000002-0001-0000-0000-000000000001', 'Fiesole Terrace Series', 'Venue Blog: Intimate Weddings in Florence','blog',  'web',       'draft',     '2026-04-01', 'Team LWD')
ON CONFLICT (id) DO NOTHING;

-- Borgo Egnazia content
INSERT INTO social_content (id, managed_account_id, campaign_id, campaign_name, title, type, platform, status, publish_date, assigned_to) VALUES
  ('d0000003-0001-0000-0000-000000000001', 'a1b2c3d4-0003-0000-0000-000000000003', 'c0000003-0001-0000-0000-000000000001', 'Puglia Season 2026', 'Trullo Suite - First Look',                'post',  'instagram', 'live',      '2026-03-07', 'Team LWD'),
  ('d0000003-0001-0000-0000-000000000002', 'a1b2c3d4-0003-0000-0000-000000000003', 'c0000003-0001-0000-0000-000000000001', 'Puglia Season 2026', 'Outdoor Ceremony Space Reel',              'reel',  'instagram', 'scheduled', '2026-03-26', 'Team LWD'),
  ('d0000003-0001-0000-0000-000000000003', 'a1b2c3d4-0003-0000-0000-000000000003', 'c0000003-0001-0000-0000-000000000001', 'Puglia Season 2026', 'The Borgo Egnazia Experience',             'blog',  'web',       'draft',     '2026-04-10', 'Team LWD')
ON CONFLICT (id) DO NOTHING;
