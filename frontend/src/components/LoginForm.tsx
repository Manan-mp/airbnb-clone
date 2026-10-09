"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { Logo } from "./Logo";
import { useToast } from "./ui/Toast";

type Mode = "login" | "signup";

/** The log in / sign up form, shared by the desktop modal and the phone `/login` page. */
export function LoginForm({ onDone }: { onDone: () => void }) {
  const { setSession } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"guest" | "host">("guest");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res =
        mode === "login" ? await api.login(email, password) : await api.signup({ email, password, name, role });
      setSession(res.access_token, res.user);
      toast.show(`Welcome${mode === "signup" ? "" : " back"}, ${res.user.name}`);
      setPassword("");
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="px-6 pb-8 pt-6">
      <div className="mb-4 flex justify-center">
        <Logo />
      </div>
      <h3 className="mb-6 text-center text-2xl font-semibold">
        {mode === "login" ? "Log in or sign up" : "Create your account"}
      </h3>
      <div className="overflow-hidden rounded-md border border-ink-muted">
        {mode === "signup" && <Field label="Name" value={name} onChange={setName} autoComplete="name" required />}
        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          autoComplete="email"
          required
          divider={mode === "signup"}
        />
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "signup" ? 8 : undefined}
          divider
        />
      </div>
      {mode === "signup" && (
        <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Account type">
          {(["guest", "host"] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={role === r}
              onClick={() => setRole(r)}
              className={`flex-1 rounded-md border px-4 py-3 text-base font-medium transition-colors duration-200 ease-airy ${
                role === r ? "border-2 border-ink bg-surface-subtle" : "border-line hover:border-ink"
              }`}
            >
              {r === "guest" ? "I want to travel" : "I want to host"}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-base text-brand-deep">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-4 h-12 w-full rounded-md bg-brand-gradient text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? "Please wait…" : mode === "login" ? "Continue" : "Sign up"}
      </button>
      <p className="mt-4 text-center text-base text-ink-secondary">
        {mode === "login" ? "New here? " : "Already have an account? "}
        <button
          type="button"
          className="font-semibold text-ink underline"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "Create an account" : "Log in"}
        </button>
      </p>
      <p className="mt-6 rounded-md bg-surface-subtle px-4 py-3 text-xs text-ink-secondary">
        Demo accounts (password <b>demo1234</b>): guest.riya@example.com · host.aarav@example.com
      </p>
    </form>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  divider?: boolean;
}) {
  return (
    <label className={`relative block ${props.divider ? "border-t border-ink-muted" : ""}`}>
      <span className="pointer-events-none absolute left-4 top-2 text-xs text-ink-secondary">{props.label}</span>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        type={props.type ?? "text"}
        autoComplete={props.autoComplete}
        required={props.required}
        minLength={props.minLength}
        className="h-[55px] w-full bg-transparent px-4 pb-1.5 pt-[29px] text-md outline-none focus:bg-surface-subtle"
      />
    </label>
  );
}
