"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { LoginForm } from "@/components/LoginForm";

/** Only same-site paths may be used as the post-login destination. */
const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

export default function LoginPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, ready, finishLogin } = useAuth();
  const next = safeNext(params.get("next"));

  useEffect(() => {
    document.title = "Log in or sign up | staybnb";
  }, []);

  // Already logged in (e.g. opened directly): nothing to do here.
  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

  return (
    <main className="mx-auto min-h-[calc(100dvh-65px)] max-w-[480px] pt-10 md:pt-24">
      <LoginForm variant="page" onDone={() => finishLogin(next)} />
    </main>
  );
}
