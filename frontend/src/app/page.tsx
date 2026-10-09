"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Status = { state: "loading" } | { state: "ok"; listings: number } | { state: "error"; message: string };

// Skeleton page: proves the browser can reach the API (CORS + env var) before the real UI lands.
export default function HomePage() {
  const [status, setStatus] = useState<Status>({ state: "loading" });

  useEffect(() => {
    fetch(`${API}/api/listings?page_size=1`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setStatus({ state: "ok", listings: d.total }))
      .catch((e: Error) => setStatus({ state: "error", message: e.message }));
  }, []);

  return (
    <main className="px-gutter py-8">
      <p className="text-2xl font-bold text-brand">staybnb</p>
      <p className="text-ink-secondary">Skeleton deploy</p>
      <p className="mt-4" data-testid="api-status">
        {status.state === "loading" && "Checking API…"}
        {status.state === "ok" && `API reachable: ${status.listings} listings`}
        {status.state === "error" && `API error: ${status.message}`}
      </p>
    </main>
  );
}
