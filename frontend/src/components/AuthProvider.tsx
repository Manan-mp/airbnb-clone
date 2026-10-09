"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "@/lib/api";
import type { User } from "@/lib/types";
import { LoginModal } from "./LoginModal";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  /** Opens the login modal. `onSuccess` runs after a successful login/sign-up. */
  requestLogin: (onSuccess?: () => void) => void;
  setSession: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [afterLogin, setAfterLogin] = useState<(() => void) | null>(null);

  useEffect(() => {
    Promise.resolve(tokenStore.get() ? api.me() : null)
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true));
  }, []);

  const setSession = useCallback((token: string, u: User) => {
    tokenStore.set(token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const requestLogin = useCallback((onSuccess?: () => void) => {
    setAfterLogin(() => onSuccess ?? null);
    setLoginOpen(true);
  }, []);

  const value = useMemo(
    () => ({ user, ready, requestLogin, setSession, logout }),
    [user, ready, requestLogin, setSession, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onDone={() => {
          setLoginOpen(false);
          afterLogin?.();
          setAfterLogin(null);
        }}
      />
    </AuthContext.Provider>
  );
}
