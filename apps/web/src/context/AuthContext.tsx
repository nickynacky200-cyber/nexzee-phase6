import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../api/client";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("nexzee_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem("nexzee_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string) {
    const res = await api.post("/auth/login", { identifier, password });
    localStorage.setItem("nexzee_token", res.data.data.token);
    setUser(res.data.data.user);
  }

  async function register(data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) {
    const res = await api.post("/auth/register", data);
    localStorage.setItem("nexzee_token", res.data.data.token);
    setUser(res.data.data.user);
  }

  function logout() {
    localStorage.removeItem("nexzee_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
