"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  fetchCurrentUser,
  getGoogleAuthUrl,
  logout as logoutApi,
} from "@/lib/api/auth";
import { tokenStorage } from "@/lib/auth/token-storage";
import type { UserProfile, UserSyncState } from "@/lib/types/user";

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  completeSignIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (profile: UserProfile) => void;
  mergeUserSync: (sync: UserSyncState) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.read();
    if (!token) {
      setUser(null);
      return;
    }

    const profile = await fetchCurrentUser(token);
    setUser(profile);
  }, []);

  const updateUserProfile = useCallback((profile: UserProfile) => {
    setUser(profile);
  }, []);

  const mergeUserSync = useCallback((sync: UserSyncState) => {
    setUser((current) => {
      if (!current) return current;
      return {
        ...current,
        sync: {
          ...current.sync,
          ...sync,
          byPlatform: sync.byPlatform ?? current.sync.byPlatform,
        },
      };
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const token = tokenStorage.read();
        if (!token) return;
        const profile = await fetchCurrentUser(token);
        if (!cancelled) setUser(profile);
      } catch {
        tokenStorage.clear();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const authUrl = await getGoogleAuthUrl();
    window.location.href = authUrl;
  }, []);

  const completeSignIn = useCallback(async (token: string) => {
    tokenStorage.save(token);
    const profile = await fetchCurrentUser(token);
    setUser(profile);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // ignore logout API failures
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      signInWithGoogle,
      completeSignIn,
      signOut,
      refreshUser,
      updateUserProfile,
      mergeUserSync,
    }),
    [
      user,
      isLoading,
      signInWithGoogle,
      completeSignIn,
      signOut,
      refreshUser,
      updateUserProfile,
      mergeUserSync,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
