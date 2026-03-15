import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signupCouple,
  loginCouple,
  logoutCouple,
  getCurrentCouple,
  onAuthStateChange,
  resetPasswordForEmail,
} from "../services/coupleAuthService";

const CoupleAuthContext = createContext();

/**
 * Couple Authentication Provider
 * Manages couple login/logout and provides auth context to entire app
 */
export function CoupleAuthProvider({ children }) {
  const [couple, setCouple] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const { data: coupleData } = await getCurrentCouple();
      if (coupleData) {
        setCouple(coupleData);
        setIsAuthenticated(true);
      } else if (import.meta.env.DEV) {
        // Dev mode: Use mock couple for testing
        setCouple({
          id: "couple-1",
          email: "couple@example.com",
          firstName: "Sarah",
          lastName: "Johnson",
        });
        setIsAuthenticated(true);
      } else {
        setCouple(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        const { data: coupleData } = await getCurrentCouple();
        if (coupleData) {
          setCouple(coupleData);
          setIsAuthenticated(true);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setCouple(null);
        setIsAuthenticated(false);
      }
    });

    return unsubscribe;
  }, []);

  // Login handler
  const handleLogin = async (email, password) => {
    setError(null);
    setLoading(true);
    const { data: coupleData, error: loginError } = await loginCouple(email, password);

    if (loginError) {
      setError(loginError);
      setLoading(false);
      return { data: null, error: loginError };
    }

    setCouple(coupleData);
    setIsAuthenticated(true);
    setLoading(false);
    return { data: coupleData, error: null };
  };

  // Signup handler
  const handleSignup = async (email, password, firstName, lastName, eventDate, guestCount) => {
    setError(null);
    setLoading(true);
    const { data: coupleData, error: signupError } = await signupCouple(
      email,
      password,
      firstName,
      lastName,
      eventDate,
      guestCount
    );

    if (signupError) {
      setError(signupError);
      setLoading(false);
      return { data: null, error: signupError };
    }

    // Auto-login after signup
    const { data: loginData, error: loginError } = await loginCouple(email, password);
    if (loginError) {
      setError(loginError);
      setLoading(false);
      return { data: null, error: loginError };
    }

    setCouple(loginData);
    setIsAuthenticated(true);
    setLoading(false);
    return { data: loginData, error: null };
  };

  // Logout handler
  const handleLogout = async () => {
    setError(null);
    const { error: logoutError } = await logoutCouple();

    if (logoutError) {
      setError(logoutError);
      return { data: null, error: logoutError };
    }

    setUser(null);
    setCouple(null);
    setIsAuthenticated(false);
    return { data: { success: true }, error: null };
  };

  // Request password reset handler
  const handleRequestPasswordReset = async (email) => {
    setError(null);
    setLoading(true);
    const { data, error: resetError } = await resetPasswordForEmail(email);

    if (resetError) {
      setError(resetError);
      setLoading(false);
      return { data: null, error: resetError };
    }

    setLoading(false);
    return { data, error: null };
  };

  // Clear error message
  const clearError = () => setError(null);

  const value = {
    couple,
    user,
    isAuthenticated,
    loading,
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    requestPasswordReset: handleRequestPasswordReset,
    clearError,
  };

  return <CoupleAuthContext.Provider value={value}>{children}</CoupleAuthContext.Provider>;
}

/**
 * Hook to access couple auth context
 */
export function useCoupleAuth() {
  const context = useContext(CoupleAuthContext);
  if (!context) {
    throw new Error("useCoupleAuth must be used within CoupleAuthProvider");
  }
  return context;
}
