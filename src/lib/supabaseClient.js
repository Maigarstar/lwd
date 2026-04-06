// ═══════════════════════════════════════════════════════════════════════════
// Supabase Client Configuration
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Re-entrant in-process lock — avoids Navigator LockManager "steal" errors.
// Supabase auth-js makes nested lock calls (e.g. getSession inside onAuthStateChange),
// so the lock must allow re-entry from the same call chain.
const _lockActive = {};
async function processLock(name, acquireTimeout, fn) {
  // If already inside this lock, re-enter immediately (avoid deadlock)
  if (_lockActive[name]) return fn();
  _lockActive[name] = true;
  try {
    return await fn();
  } finally {
    _lockActive[name] = false;
  }
}

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      lock: processLock,
    },
  });
} else if (import.meta.env.DEV) {
  console.warn("[Supabase] Environment variables not configured. Database features disabled.");
}

export { supabase };

export function isSupabaseAvailable() {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
}
