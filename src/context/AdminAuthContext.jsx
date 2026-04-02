// ─── Admin Authentication Context ────────────────────────────────────────────
// Wraps Supabase's onAuthStateChange so the whole admin tree knows
// immediately when the session appears or disappears.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { loginAdmin, logoutAdmin } from "../services/adminAuthService";

const AdminAuthCtx = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin]               = useState(null);
  const [isAuthenticated, setAuth]      = useState(false);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    // onAuthStateChange fires an INITIAL_SESSION event immediately — use it as
    // the single source of truth so we're resilient to Strict Mode double-mounts
    // and any AbortError from getSession() lock contention.
    let loaded = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAdmin(session.user);
        setAuth(true);
      } else {
        setAdmin(null);
        setAuth(false);
      }
      if (!loaded) { loaded = true; setLoading(false); }
    });

    // Fallback: if onAuthStateChange never fires within 4s, unblock the UI
    const fallback = setTimeout(() => { if (!loaded) { loaded = true; setLoading(false); } }, 4000);

    return () => { subscription.unsubscribe(); clearTimeout(fallback); };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await loginAdmin(email, password);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutAdmin();
    // onAuthStateChange fires and clears state automatically
  };

  return (
    <AdminAuthCtx.Provider value={{ admin, isAuthenticated, loading, login, logout }}>
      {children}
    </AdminAuthCtx.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthCtx);
  if (!context) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return context;
}
