// ─── src/context/VendorAuthContext.jsx ───────────────────────────────────────
// Vendor authentication context - manages session state and auth operations
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from "react";
import {
  loginVendor,
  logoutVendor,
  signupVendor,
  activateVendor,
  getCurrentVendor,
  onAuthStateChange,
  resetPasswordForEmail,
} from "../services/vendorAuthService";

const VendorAuthContext = createContext(null);

export function VendorAuthProvider({ children }) {
  const [vendor, setVendor] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const { data: vendorData } = await getCurrentVendor();
      if (vendorData) {
        setVendor(vendorData);
        setIsAuthenticated(true);
      } else if (import.meta.env.DEV) {
        // Dev mode: Use mock vendor for testing
        setVendor({
          id: "vdr-13",
          name: "The Grand Pavilion",
          email: "contact@grandpavilion.com",
        });
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((authState) => {
      setUser(authState.user);
      setVendor(authState.vendor);
      setIsAuthenticated(authState.isAuthenticated);
    });

    return () => unsubscribe();
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const { data: vendorData, error: loginError } = await loginVendor(email, password);

      if (loginError) {
        setError(loginError.message || "Login failed");
        return { data: null, error: loginError };
      }

      setVendor(vendorData);
      setIsAuthenticated(true);
      return { data: vendorData, error: null };
    } catch (err) {
      setError(err.message || "Login error");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Signup handler
  const signup = async (email, password, vendorName) => {
    try {
      setError(null);
      setLoading(true);
      const { data: vendorData, error: signupError } = await signupVendor(email, password, vendorName);

      if (signupError) {
        setError(signupError.message || "Signup failed");
        return { data: null, error: signupError };
      }

      setVendor(vendorData);
      setIsAuthenticated(true);
      return { data: vendorData, error: null };
    } catch (err) {
      setError(err.message || "Signup error");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      const { error: logoutError } = await logoutVendor();

      if (logoutError) {
        setError(logoutError.message || "Logout failed");
        return { data: null, error: logoutError };
      }

      setVendor(null);
      setUser(null);
      setIsAuthenticated(false);
      return { data: { success: true }, error: null };
    } catch (err) {
      setError(err.message || "Logout error");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Activate handler (for invitation flow)
  const activate = async (activationToken, password) => {
    try {
      setError(null);
      setLoading(true);
      const { data, error: activateError } = await activateVendor(activationToken, password);

      if (activateError) {
        setError(activateError.message || "Activation failed");
        return { data: null, error: activateError };
      }

      return { data, error: null };
    } catch (err) {
      setError(err.message || "Activation error");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Request password reset handler
  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      setLoading(true);
      const { data, error: resetError } = await resetPasswordForEmail(email);

      if (resetError) {
        setError(resetError.message || "Failed to send reset email");
        return { data: null, error: resetError };
      }

      return { data, error: null };
    } catch (err) {
      setError(err.message || "Password reset error");
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  return (
    <VendorAuthContext.Provider
      value={{
        vendor,
        user,
        isAuthenticated,
        loading,
        error,
        login,
        signup,
        logout,
        activate,
        requestPasswordReset,
        clearError,
      }}
    >
      {children}
    </VendorAuthContext.Provider>
  );
}

// Hook to use vendor auth context
export function useVendorAuth() {
  const context = useContext(VendorAuthContext);
  if (!context) {
    throw new Error("useVendorAuth must be used within VendorAuthProvider");
  }
  return context;
}
