import Link from "next/link";

/** Text wordmark (no logo artwork). */
export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} aria-label="staybnb home" className={`text-xl font-bold tracking-tight text-brand ${className}`}>
      staybnb
    </Link>
  );
}
