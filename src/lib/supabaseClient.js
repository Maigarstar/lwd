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
  }
  // Create a mock client that will fail gracefully when methods are called
  supabase = {
    from: () => ({ select: async () => ({ data: [], error: new Error("Supabase not configured") }) }),
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
