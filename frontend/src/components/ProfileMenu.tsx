"use client";

import { Menu, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useToast } from "./ui/Toast";

const circle =
  "flex size-10 items-center justify-center rounded-full bg-surface-control transition-transform duration-[250ms] ease-airy hover:scale-105";

export function ProfileMenu() {
  const { user, requestLogin, logout } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const item = "block w-full px-4 py-3 text-left text-base transition-colors duration-150 ease-airy hover:bg-surface-control";

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      <Link
        href="/host"
        className="hidden rounded-full px-4 py-3 text-base font-medium transition-colors duration-200 ease-airy hover:bg-surface-control lg:block"
      >
        {user?.role === "host" ? "Switch to hosting" : "Become a host"}
      </Link>
      <button type="button" aria-label="Account" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={circle}>
        <UserIcon size={18} />
      </button>
      <button type="button" aria-label="Main navigation menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={circle}>
        <Menu size={18} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-[60] w-60 overflow-hidden rounded-md bg-surface py-2 shadow-modal">
          {user ? (
            <>
              <p className="px-4 py-2 text-base font-semibold">{user.name}</p>
              <Link role="menuitem" href="/trips" className={item} onClick={() => setOpen(false)}>Trips</Link>
              <Link role="menuitem" href="/wishlists" className={item} onClick={() => setOpen(false)}>Wishlists</Link>
              <Link role="menuitem" href="/messages" className={item} onClick={() => setOpen(false)}>Messages</Link>
              <Link role="menuitem" href="/identity-verification" className={item} onClick={() => setOpen(false)}>Identity verification</Link>
              {user.role === "host" && (
                <Link role="menuitem" href="/host" className={item} onClick={() => setOpen(false)}>Host dashboard</Link>
              )}
              <div className="my-2 border-t border-line-soft" />
              <button
                role="menuitem"
                className={item}
                onClick={() => {
                  logout();
                  setOpen(false);
                  toast.show("You’ve been logged out");
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button role="menuitem" className={`${item} font-semibold`} onClick={() => { setOpen(false); requestLogin(); }}>Log in</button>
              <button role="menuitem" className={item} onClick={() => { setOpen(false); requestLogin(); }}>Sign up</button>
              <div className="my-2 border-t border-line-soft" />
              <Link role="menuitem" href="/host" className={item} onClick={() => setOpen(false)}>Become a host</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
