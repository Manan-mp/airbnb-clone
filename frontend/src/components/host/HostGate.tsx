"use client";

import { Home, Lock } from "lucide-react";
import { useAuth } from "../AuthProvider";
import { PageShell } from "../PageShell";
import { LoginPrompt, StatePanel } from "../StatePanel";

/** Renders children only for a logged-in host; guests get an explanation. */
export function HostGate({ children }: { children: (user: { id: number; name: string }) => React.ReactNode }) {
  const { user, ready, logout, requestLogin } = useAuth();
  if (!ready) return <PageShell><div className="min-h-[60vh]" aria-busy="true" /></PageShell>;
  if (!user)
    return (
      <PageShell>
        <LoginPrompt icon={Lock} title="Log in to host" body="Sign in with a host account to manage your listings and bookings." />
      </PageShell>
    );
  if (user.role !== "host")
    return (
      <PageShell>
        <StatePanel
          icon={Home}
          title="Switch to hosting"
          body="Your account is a guest account, so it can’t create or manage listings. Log out and sign up with “I want to host” to start earning from your place."
          action={{ label: "Log out and sign up as a host", onClick: () => { logout(); requestLogin(); } }}
          testId="host-guest-notice"
        />
      </PageShell>
    );
  return <>{children(user)}</>;
}
