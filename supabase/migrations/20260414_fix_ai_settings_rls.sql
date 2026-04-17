-- =============================================================================
-- Fix AI Settings RLS for Frontend Access
-- =============================================================================
-- The admin dashboard needs to write to ai_settings directly from the browser.
-- The current RLS policy requires 'authenticated' role, but the frontend uses
-- the anon key. This migration allows direct database writes for both anon and
-- authenticated users.
-- =============================================================================

-- Update ai_settings RLS policy to allow both anon and authenticated
DROP POLICY IF EXISTS "admin_manage_ai_settings" ON public.ai_settings;

CREATE POLICY "ai_settings_admin_access"
  ON public.ai_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify the policy was created
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'ai_settings'
ORDER BY policyname;
