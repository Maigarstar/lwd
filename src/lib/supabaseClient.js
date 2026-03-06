// ═══════════════════════════════════════════════════════════════════════════
// Supabase Client Stub
// ═══════════════════════════════════════════════════════════════════════════
// TODO: Configure with real Supabase credentials from environment variables
// For now, exports a stub to prevent build errors

export const supabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: { code: "PGRST116" } }),
      }),
      on: () => ({
        subscribe: () => ({
          unsubscribe: () => {},
        }),
      }),
    }),
    update: () => ({
      eq: () => ({
        select: async () => ({ data: null, error: null }),
      }),
    }),
    insert: () => ({
      select: async () => ({ data: null, error: null }),
    }),
  }),
  on: () => ({
    subscribe: () => ({
      unsubscribe: () => {},
    }),
  }),
};
