import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { request } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("/auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const { user: currentUser } = await request("/auth/login", {
      method: "POST",
      data: credentials
    });
    setUser(currentUser);
    return currentUser;
  }

  async function register(details) {
    const { user: currentUser } = await request("/auth/register", {
      method: "POST",
      data: details
    });
    setUser(currentUser);
    return currentUser;
  }

  async function logout() {
    await request("/auth/logout", { method: "POST" });
    setUser(null);
  }

  async function refresh() {
    const { user: currentUser } = await request("/auth/me");
    setUser(currentUser);
    return currentUser;
  }

  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
