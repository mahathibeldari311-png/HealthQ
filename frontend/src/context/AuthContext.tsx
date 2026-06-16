"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  avatar?: string;
  allergy_profile: string; // JSON string
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateAllergies: (allergies: string[]) => Promise<void>;
  updateProfile: (fullName: string, avatar: string) => Promise<void>;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadCurrentUser = async (authToken: string) => {
    try {
      localStorage.setItem("healthq_token", authToken);
      setToken(authToken);
      const profile = await api.getMe();
      setUser(profile);
    } catch (err) {
      console.error("Failed to load user profile, using demo mode:", err);
      // Fallback to a mock demo user if the backend is not running or has error
      setMockUser();
    }
  };

  const setMockUser = () => {
    const mockProfile: UserProfile = {
      id: 999,
      email: "demo@healthq.com",
      full_name: "Demo Patient",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Demo",
      allergy_profile: JSON.stringify(["Penicillin", "Sulfa drugs"]),
      created_at: new Date().toISOString()
    };
    setUser(mockProfile);
    setToken("mock-firebase-token");
    localStorage.setItem("healthq_token", "mock-firebase-token");
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem("healthq_token");
      if (savedToken) {
        await loadCurrentUser(savedToken);
      } else {
        // Do not auto-login with mock user. Leave user as null so they must login/signup.
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Redirect handling for protected / public routes
  useEffect(() => {
    if (!loading) {
      const publicRoutes = ["/", "/login", "/register"];
      const isPublicRoute = publicRoutes.includes(pathname || "");
      if (!user && !isPublicRoute) {
        router.push("/login");
      } else if (user && (pathname === "/login" || pathname === "/register")) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.login({ email, password });
      await loadCurrentUser(response.access_token);
      router.push("/dashboard");
    } catch (err) {
      setLoading(false);
      throw err;
    }
    setLoading(false);
  };

  const register = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      await api.register({ email, password, full_name: fullName });
      // Auto login after registration
      const response = await api.login({ email, password });
      await loadCurrentUser(response.access_token);
      router.push("/dashboard");
    } catch (err) {
      setLoading(false);
      throw err;
    }
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("healthq_token");
    router.push("/login");
  };

  const loginAsGuest = () => {
    setMockUser();
    router.push("/dashboard");
  };

  const refreshUser = async () => {
    const currentToken = localStorage.getItem("healthq_token");
    if (currentToken) {
      try {
        const profile = await api.getMe();
        setUser(profile);
      } catch (err) {
        console.error("Refresh user profile failed", err);
      }
    }
  };

  const updateAllergies = async (allergies: string[]) => {
    if (token === "mock-firebase-token") {
      setUser(prev => {
        if (!prev) return null;
        return { ...prev, allergy_profile: JSON.stringify(allergies) };
      });
      return;
    }
    try {
      const updated = await api.updateAllergies(allergies);
      setUser(updated);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateProfile = async (fullName: string, avatar: string) => {
    if (token === "mock-firebase-token") {
      setUser(prev => {
        if (!prev) return null;
        return { ...prev, full_name: fullName, avatar };
      });
      return;
    }
    try {
      const updated = await api.updateProfile({ full_name: fullName, avatar });
      setUser(updated);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateAllergies,
        updateProfile,
        loginAsGuest
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
