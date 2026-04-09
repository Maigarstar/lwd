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
} else {
  if (import.meta.env.DEV) {
    console.warn("[Supabase] Environment variables not configured. Database features disabled.");
  }
  // Safe no-op proxy — prevents null crashes across the entire app
  const noopQuery = () => ({ data: null, error: null, count: 0, then: (fn) => Promise.resolve(fn({ data: null, error: null })) });
  const chainable = () => new Proxy({}, { get: () => chainable() });
  const queryProxy = new Proxy({}, {
    get(_, method) {
      if (["select","insert","update","upsert","delete"].includes(method)) return () => queryProxy;
      if (["eq","neq","gt","gte","lt","lte","like","ilike","is","in","not","or","order","limit","range","single","maybeSingle","csv","count","head"].includes(method)) return () => queryProxy;
      if (method === "then") return (fn) => Promise.resolve(fn({ data: null, error: null, count: 0 }));
      return () => queryProxy;
    },
  });
  supabase = {
    from: () => queryProxy,
    rpc: () => Promise.resolve({ data: null, error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signUp: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: "Supabase not configured" } }),
      signOut: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ data: null, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    channel: () => ({
      on: function() { return this; },
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    removeChannel: () => {},
    storage: { from: () => ({ upload: () => Promise.resolve({ data: null, error: null }), getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
  };
}

export { supabase };

export function isSupabaseAvailable() {
  return !!(supabaseUrl && supabaseAnonKey && supabase);
}
