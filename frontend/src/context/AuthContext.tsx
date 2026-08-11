import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, apiErrorMessage } from "../api/client";
import { AuthUser } from "../api/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("erp_user");
    const storedToken = localStorage.getItem("erp_token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("erp_token", data.token);
      localStorage.setItem("erp_user", JSON.stringify(data.user));
      setUser(data.user);
    } catch (err) {
      throw new Error(apiErrorMessage(err));
    }
  }

  function logout() {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
