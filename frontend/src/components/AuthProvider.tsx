"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "@/lib/api";
import type { User } from "@/lib/types";
import { isPhoneNow } from "@/lib/useIsPhone";
import { LoginModal } from "./LoginModal";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  /**
   * Asks the visitor to log in: a modal on desktop, the `/login` page on phones (which returns to the
   * current page afterwards). `onSuccess` runs after a successful login/sign-up either way.
   */
  requestLogin: (onSuccess?: () => void) => void;
  /** Called by the `/login` page once logged in: runs the pending `onSuccess`, then goes to `next`. */
  finishLogin: (next: string) => void;
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
  const router = useRouter();

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

  const requestLogin = useCallback(
    (onSuccess?: () => void) => {
      setAfterLogin(() => onSuccess ?? null);
      if (isPhoneNow()) {
        const here = window.location.pathname + window.location.search;
        router.push(`/login?next=${encodeURIComponent(here)}`);
      } else {
        setLoginOpen(true);
      }
    },
    [router],
  );

  const finishLogin = useCallback(
    (next: string) => {
      router.replace(next);
      afterLogin?.();
      setAfterLogin(null);
    },
    [afterLogin, router],
  );

  const value = useMemo(
    () => ({ user, ready, requestLogin, finishLogin, setSession, logout }),
    [user, ready, requestLogin, finishLogin, setSession, logout],
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
