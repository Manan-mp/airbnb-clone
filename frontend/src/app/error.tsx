"use client";

import Link from "next/link";
import { useEffect } from "react";

/** Last-resort boundary for render errors: a friendly message with a retry instead of a blank page. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[560px] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-md text-ink-secondary">We hit an unexpected problem loading this page. Please try again.</p>
      <div className="mt-8 flex gap-3">
        <button type="button" onClick={reset} className="rounded-md bg-ink px-6 py-3.5 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98]">
          Try again
        </button>
        <Link href="/" className="rounded-md border border-ink px-6 py-3.5 text-md font-medium transition-colors duration-200 ease-airy hover:bg-surface-subtle">
          Back to home
        </Link>
      </div>
    </main>
  );
}
