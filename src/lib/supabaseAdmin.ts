// ═══════════════════════════════════════════════════════════════════════════
// Supabase Admin Client - Service Role
// ═══════════════════════════════════════════════════════════════════════════
// Uses the service_role key which bypasses Row Level Security.
// ONLY import this in admin-facing services. Never use in public-facing forms.
// The service role key is safe here because this code only runs in the
// admin dashboard, which is an internal tool.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

let supabaseAdmin: ReturnType<typeof createClient> | null = null

if (supabaseUrl && serviceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export const isAdminClientAvailable = () => !!supabaseAdmin

export { supabaseAdmin }
