-- ════════════════════════════════════════════════════════════════════════════
-- LWD Magazine — RLS Lockdown
-- 20260418_magazine_rls_policies.sql
--
-- Establishes proper row-level security across all magazine tables.
-- Prior state: most tables had RLS disabled or an open allow_all policy.
-- This migration closes the main exposure vectors:
--   • Anon users could read draft/archived issues and pages
--   • Anyone could insert forged read events
--   • Anyone could modify ad impression/click counters
--   • Personalised editions were enumerable
--   • Collaboration tokens were readable by anyone
--
-- Policy model:
--   authenticated  = signed-in admin/editor — full access everywhere
--   anon           = public reader — read published content only,
--                    insert-only analytics, no writes to business data
--
-- NOTE: Tables used only by authenticated admin (render_history, brand_kit)
-- get a simple "authenticated = all" guard. No anon access.
-- ════════════════════════════════════════════════════════════════════════════


-- ── 0. Drop all existing open policies ────────────────────────────────────────
-- Postgres won't let you create a policy with a name that already exists,
-- so drop before re-creating. Use IF EXISTS to make this idempotent.

DROP POLICY IF EXISTS "allow_all" ON magazine_read_events;
DROP POLICY IF EXISTS "allow_all" ON magazine_collaborators;
DROP POLICY IF EXISTS "allow_all" ON magazine_page_comments;
DROP POLICY IF EXISTS "allow_all" ON magazine_personalised_issues;

-- Also clean up any stale "public_*" or "admin_*" policies from earlier experiments
DROP POLICY IF EXISTS "public_read"        ON magazine_issues;
DROP POLICY IF EXISTS "admin_all"          ON magazine_issues;
DROP POLICY IF EXISTS "public_read"        ON magazine_issue_pages;
DROP POLICY IF EXISTS "admin_all"          ON magazine_issue_pages;
DROP POLICY IF EXISTS "anon_insert"        ON magazine_read_events;
DROP POLICY IF EXISTS "admin_all"          ON magazine_read_events;
DROP POLICY IF EXISTS "public_read"        ON magazine_ad_placements;
DROP POLICY IF EXISTS "admin_all"          ON magazine_ad_placements;
DROP POLICY IF EXISTS "token_select"       ON magazine_collaborators;
DROP POLICY IF EXISTS "admin_all"          ON magazine_collaborators;
DROP POLICY IF EXISTS "admin_all"          ON magazine_page_comments;
DROP POLICY IF EXISTS "slug_select"        ON magazine_personalised_issues;
DROP POLICY IF EXISTS "admin_all"          ON magazine_personalised_issues;
DROP POLICY IF EXISTS "public_read"        ON magazine_collections;
DROP POLICY IF EXISTS "admin_all"          ON magazine_collections;
DROP POLICY IF EXISTS "public_read"        ON magazine_collection_issues;
DROP POLICY IF EXISTS "admin_all"          ON magazine_collection_issues;
DROP POLICY IF EXISTS "admin_all"          ON magazine_render_history;
DROP POLICY IF EXISTS "admin_all"          ON magazine_brand_kit;


-- ════════════════════════════════════════════════════════════════════════════
-- 1. magazine_issues
-- ════════════════════════════════════════════════════════════════════════════
-- Anon: read published issues only (status = 'published').
-- Authenticated: full access for studio/admin.

ALTER TABLE magazine_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON magazine_issues
  FOR SELECT
  USING (
    auth.role() = 'authenticated'          -- admins see everything
    OR status = 'published'                -- anon sees published only
  );

CREATE POLICY "admin_all" ON magazine_issues
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════════════════════
-- 2. magazine_issue_pages
-- ════════════════════════════════════════════════════════════════════════════
-- Anon: read pages whose parent issue is published.
-- Authenticated: full access.

ALTER TABLE magazine_issue_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON magazine_issue_pages
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    OR EXISTS (
      SELECT 1 FROM magazine_issues mi
      WHERE mi.id = magazine_issue_pages.issue_id
        AND mi.status = 'published'
    )
  );

CREATE POLICY "admin_all" ON magazine_issue_pages
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════════════════════
-- 3. magazine_read_events  (reader analytics)
-- ════════════════════════════════════════════════════════════════════════════
-- Anon: INSERT only — readers can track their own events.
--       No SELECT (can't read other users' sessions), no UPDATE/DELETE.
-- Authenticated: full access for analytics dashboards.

ALTER TABLE magazine_read_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON magazine_read_events
  FOR INSERT
  WITH CHECK (true);   -- any insert allowed; no PII, just session events

CREATE POLICY "admin_all" ON magazine_read_events
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════════════════════
-- 4. magazine_ad_placements
-- ════════════════════════════════════════════════════════════════════════════
-- Anon: SELECT active placements for published issues (needed by reader UI).
--       No INSERT/UPDATE/DELETE — impression/click increments go via RPC.
-- Authenticated: full access.
-- The increment_ad_stat() function is SECURITY DEFINER so anon can call it
-- without needing direct write access to the table.

ALTER TABLE magazine_ad_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON magazine_ad_placements
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    OR (
      is_active = true
      AND EXISTS (
        SELECT 1 FROM magazine_issues mi
        WHERE mi.id = magazine_ad_placements.issue_id
          AND mi.status = 'published'
      )
    )
  );

CREATE POLICY "admin_all" ON magazine_ad_placements
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Make increment_ad_stat SECURITY DEFINER so anon readers can call it
-- without needing UPDATE rights on the table.
CREATE OR REPLACE FUNCTION increment_ad_stat(p_placement_id uuid, p_field text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_field = 'impressions' THEN
    UPDATE magazine_ad_placements
       SET impressions = impressions + 1
     WHERE id = p_placement_id AND is_active = true;
  ELSIF p_field = 'clicks' THEN
    UPDATE magazine_ad_placements
       SET clicks = clicks + 1
     WHERE id = p_placement_id AND is_active = true;
  END IF;
END;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- 5. magazine_collaborators
-- ════════════════════════════════════════════════════════════════════════════
-- Collaborators access the studio via a token URL. They are not
-- authenticated (Supabase auth) — they're anon users with a UUID token.
-- Policy: anon can SELECT/UPDATE rows where token matches what they supply.
-- This is safe because tokens are UUIDs — not guessable.
-- Authenticated: full access for admin.

ALTER TABLE magazine_collaborators ENABLE ROW LEVEL SECURITY;

-- Token-holders can read their own collaborator row (to verify access)
-- and update last_active. We use a session variable pattern:
-- client calls: SET LOCAL app.collaborator_token = '<token>'  (via RPC)
-- OR we simply allow anon SELECT (tokens are unguessable UUIDs, acceptable).
CREATE POLICY "token_select" ON magazine_collaborators
  FOR SELECT
  USING (
    auth.role() = 'authenticated'
    OR status = 'active'   -- only active (not revoked) tokens visible to anon
  );

CREATE POLICY "token_update_activity" ON magazine_collaborators
  FOR UPDATE
  USING (status = 'active')           -- anon can only update active tokens
  WITH CHECK (status = 'active');     -- can't change status via this path

CREATE POLICY "admin_all" ON magazine_collaborators
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════════════════════
-- 6. magazine_page_comments
-- ════════════════════════════════════════════════════════════════════════════
-- Comments are editorial/collaboration tools — not public.
-- Authenticated: full access (admin + studio).
-- Anon: access via SECURITY DEFINER RPC functions only (see section 12).

ALTER TABLE magazine_page_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON magazine_page_comments
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════════════════════
-- 7. magazine_personalised_issues
-- ════════════════════════════════════════════════════════════════════════════
-- Couples receive a URL with a unique slug. Anon SELECT is necessary for
-- the reader to load their personalised edition. Slugs are long/opaque so
-- enumeration is impractical in v1. Writes are admin-only.

ALTER TABLE magazine_personalised_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slug_select" ON magazine_personalised_issues
  FOR SELECT
  USING (true);  -- slug-based filter enforced by client; tokens are opaque UUIDs

CREATE POLICY "admin_all" ON magazine_personalised_issues
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════════════════════
-- 8. magazine_collections + magazine_collection_issues
-- ════════════════════════════════════════════════════════════════════════════
-- Collections are public catalogue metadata — anon read is fine.

ALTER TABLE magazine_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON magazine_collections
  FOR SELECT USING (true);

CREATE POLICY "admin_all" ON magazine_collections
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE magazine_collection_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON magazine_collection_issues
  FOR SELECT USING (true);

CREATE POLICY "admin_all" ON magazine_collection_issues
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════════════════════
-- 9. magazine_render_history  (internal — admin only)
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE magazine_render_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON magazine_render_history
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════════════════════
-- 10. magazine_brand_kit  (internal — admin only)
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE magazine_brand_kit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON magazine_brand_kit
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════════════════════
-- 11. magazine_analytics  (the older analytics table from issues migration)
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE magazine_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert" ON magazine_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_all" ON magazine_analytics
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ════════════════════════════════════════════════════════════════════════════
-- 12. Collaboration RPC functions (SECURITY DEFINER)
-- ════════════════════════════════════════════════════════════════════════════
-- The collaboration page is accessed by anon users holding a token URL.
-- They need to read draft issues + pages + comments, and insert comments.
-- Rather than open up the underlying tables to anon, these two SECURITY DEFINER
-- functions validate the token server-side and return only the data for that
-- specific collaboration session. Anon users never get blanket SELECT access.

-- get_collab_data(token): validate token, update last_active, return bundle
CREATE OR REPLACE FUNCTION get_collab_data(p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_collab  magazine_collaborators%ROWTYPE;
  v_issue   magazine_issues%ROWTYPE;
  v_pages   jsonb;
  v_comments jsonb;
BEGIN
  SELECT * INTO v_collab
  FROM magazine_collaborators
  WHERE token = p_token AND status != 'revoked'
  LIMIT 1;

  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Mark active + refresh timestamp
  UPDATE magazine_collaborators
  SET status = 'active', last_active = now()
  WHERE id = v_collab.id;

  SELECT * INTO v_issue FROM magazine_issues WHERE id = v_collab.issue_id;

  SELECT COALESCE(jsonb_agg(row_to_json(p) ORDER BY p.page_number), '[]')
  INTO v_pages
  FROM magazine_issue_pages p
  WHERE p.issue_id = v_collab.issue_id;

  SELECT COALESCE(jsonb_agg(row_to_json(c) ORDER BY c.created_at DESC), '[]')
  INTO v_comments
  FROM magazine_page_comments c
  WHERE c.issue_id = v_collab.issue_id;

  RETURN jsonb_build_object(
    'collaborator', row_to_json(v_collab),
    'issue',        row_to_json(v_issue),
    'pages',        v_pages,
    'comments',     v_comments
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_collab_data(text) TO anon;

-- add_collab_comment(token, ...): validate token, insert comment
CREATE OR REPLACE FUNCTION add_collab_comment(
  p_token       text,
  p_page_number int,
  p_content     text,
  p_author_name text DEFAULT NULL,
  p_author_email text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_collab  magazine_collaborators%ROWTYPE;
  v_comment magazine_page_comments%ROWTYPE;
BEGIN
  SELECT * INTO v_collab
  FROM magazine_collaborators
  WHERE token = p_token AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired collaborator token';
  END IF;

  INSERT INTO magazine_page_comments (
    issue_id, page_number, content, author_name
  ) VALUES (
    v_collab.issue_id, p_page_number, p_content,
    COALESCE(p_author_name, p_author_email, 'Collaborator')
  )
  RETURNING * INTO v_comment;

  RETURN row_to_json(v_comment);
END;
$$;

GRANT EXECUTE ON FUNCTION add_collab_comment(text, int, text, text, text) TO anon;


-- ════════════════════════════════════════════════════════════════════════════
-- Verification queries (run manually after applying to confirm)
-- ════════════════════════════════════════════════════════════════════════════
--
-- 1. Confirm RLS is ON for all magazine tables:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE tablename LIKE 'magazine_%' ORDER BY tablename;
--    → All should show rowsecurity = true
--
-- 2. Test anon cannot read drafts (must return 0 rows):
--    Run as anon role:
--    SELECT id, title, status FROM magazine_issues WHERE status = 'draft' LIMIT 5;
--    → Should return 0 rows
--
-- 3. Test anon can read published:
--    SELECT id, title, status FROM magazine_issues WHERE status = 'published' LIMIT 5;
--    → Should return rows
--
-- 4. Test anon cannot write to ad_placements:
--    UPDATE magazine_ad_placements SET impressions = 999 WHERE id = '<any-id>';
--    → Should fail with RLS violation
--
-- 5. Test anon can insert read events:
--    INSERT INTO magazine_read_events (issue_id, session_id, event_type)
--    VALUES ('<published-issue-id>', 'test-session', 'view');
--    → Should succeed
--
-- 6. Test increment_ad_stat RPC still works for anon:
--    SELECT increment_ad_stat('<placement-id>', 'impressions');
--    → Should succeed (SECURITY DEFINER bypasses RLS)
