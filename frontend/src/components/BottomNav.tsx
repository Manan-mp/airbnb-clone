"use client";

import { Heart, Luggage, Search, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "./AuthProvider";

export function BottomNav() {
  const pathname = usePathname();
  const { user, requestLogin } = useAuth();
  const base = "flex flex-1 flex-col items-center gap-1 pt-2 text-xs transition-colors duration-150 ease-airy";
  const tone = (active: boolean) => (active ? "font-medium text-brand" : "text-ink-secondary");

  // the listing and booking pages have their own fixed bottom bar
  if (pathname.startsWith("/rooms/") || pathname.startsWith("/book/")) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 flex h-[65px] border-t border-line-soft bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <Link href="/" className={clsx(base, tone(pathname === "/" || pathname.startsWith("/s")))}>
        <Search size={24} /> Explore
      </Link>
      <Link href="/wishlists" className={clsx(base, tone(pathname.startsWith("/wishlists")))}>
        <Heart size={24} /> Wishlists
      </Link>
      {user && (
        <Link href="/trips" className={clsx(base, tone(pathname.startsWith("/trips")))}>
          <Luggage size={24} /> Trips
        </Link>
      )}
      {user ? (
        <Link href={user.role === "host" ? "/host" : "/trips"} className={clsx(base, tone(pathname.startsWith("/host")))}>
          <UserCircle size={24} /> {user.name.split(" ")[0]}
        </Link>
      ) : (
        <button type="button" onClick={() => requestLogin()} className={clsx(base, tone(pathname === "/login"))}>
          <UserCircle size={24} /> Log in
        </button>
      )}
    </nav>
  );
}
