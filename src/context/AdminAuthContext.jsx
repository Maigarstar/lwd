// ─── Admin Authentication Context ──────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from "react";
import { loginAdmin, logoutAdmin, getCurrentAdmin } from "../services/adminAuthService";

const AdminAuthCtx = createContext();

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize admin session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const result = await getCurrentAdmin();
      if (result.data) {
        setAdmin(result.data);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await loginAdmin(email, password);
      if (result.data) {
        setAdmin(result.data);
        setIsAuthenticated(true);
        return { data: result.data, error: null };
      } else {
        return { data: null, error: result.error };
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutAdmin();
      setAdmin(null);
      setIsAuthenticated(false);
      return { data: null, error: null };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthCtx.Provider value={{ admin, isAuthenticated, loading, login, logout }}>
      {children}
    </AdminAuthCtx.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthCtx);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
