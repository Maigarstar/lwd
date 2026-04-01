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
    // Restore any existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAdmin(session.user);
        setAuth(true);
      }
      setLoading(false);
    });

    // Stay in sync for the lifetime of this provider
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAdmin(session.user);
        setAuth(true);
      } else {
        setAdmin(null);
        setAuth(false);
      }
    });

    return () => subscription.unsubscribe();
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
