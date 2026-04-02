// ═══════════════════════════════════════════════════════════════════════════
// Supabase Client Configuration
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseAnonKey) {
  // Log warning but don't throw - allow app to load with mock/null client
  if (typeof window !== "undefined") {
    console.warn("Supabase environment variables not configured. Database features will be unavailable.");
    console.warn("Supabase credentials not configured. Using mock data fallback.");
  }
  // Create a mock client that supports the full query chain
  // Returns error object for all queries to allow graceful fallback
  const createMockPromise = () => Promise.resolve({
    data: null,
    error: new Error("Supabase not configured")
  });

  const mockQuery = {
    then: (resolve) => createMockPromise().then(resolve),
    catch: (reject) => createMockPromise().catch(reject),
    select: function() { return this; },
    eq: function() { return this; },
    not: function() { return this; },
    order: function() { return this; },
    limit: function() { return this; },
    on: function() { return this; },
    subscribe: function() { return { unsubscribe: () => {} }; },
  };

  supabase = {
    from: () => ({
      select: () => mockQuery,
      insert: () => mockQuery,
      update: () => mockQuery,
      delete: () => mockQuery,
      on: () => mockQuery,
    }),
    removeSubscription: () => {},
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Bypass Web Lock API — prevents AbortError in dev (React double-mount)
      lock: (_name, _timeout, fn) => fn(),
    },
  });
}

// Helper to check if Supabase is available
const isSupabaseAvailable = () => !!supabase && supabase !== null && typeof supabase.from === 'function';

export { supabase, isSupabaseAvailable };
