"use client";

import { Ban, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { ListingDetail } from "@/lib/types";
import { PageShell } from "../PageShell";
import { StatePanel } from "../StatePanel";
import { HostGate } from "./HostGate";
import { ListingForm } from "./ListingForm";

type Load =
  | { id: string; status: "ok"; listing: ListingDetail }
  | { id: string; status: "missing" | "error"; message: string };

export function EditListing({ id }: { id: string }) {
  return <HostGate>{(user) => <Loader id={id} userId={user.id} />}</HostGate>;
}

function Loader({ id, userId }: { id: string; userId: number }) {
  const [load, setLoad] = useState<Load | null>(null);

  useEffect(() => {
    document.title = "Edit listing | staybnb";
    let cancelled = false;
    api
      .listing(id)
      .then((listing) => !cancelled && setLoad({ id, status: "ok", listing }))
      .catch((e: unknown) => {
        if (cancelled) return;
        const status = e instanceof ApiError ? e.status : 0;
        const missing = status === 404 || status === 410 || status === 422;
        setLoad({ id, status: missing ? "missing" : "error", message: e instanceof Error ? e.message : "Something went wrong" });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const current = load && load.id === id ? load : null;
  let body: React.ReactNode;
  if (!current) body = <div className="min-h-[40vh]" aria-busy="true" />;
  else if (current.status === "missing") body = <StatePanel icon={TriangleAlert} title="We can’t find that listing" body="It may have been deleted or archived." action={{ label: "Back to dashboard", href: "/host" }} testId="edit-missing" />;
  else if (current.status === "error") body = <StatePanel icon={TriangleAlert} title="We couldn’t load this listing" body={current.message} action={{ label: "Back to dashboard", href: "/host" }} />;
  else if (current.status !== "ok") body = null;
  else if (current.listing.host.id !== userId)
    body = <StatePanel icon={Ban} title="You can’t edit this listing" body="Only the host who created a listing can change it." action={{ label: "Back to dashboard", href: "/host" }} testId="edit-forbidden" />;
  else
    body = (
      <>
        <h1 className="mx-auto mb-8 max-w-[720px] text-2xl font-semibold">Edit listing</h1>
        <ListingForm key={current.listing.id} listing={current.listing} />
      </>
    );

  return (
    <PageShell>
      <main className="mx-auto min-h-[60vh] max-w-content px-6 pb-8 pt-8 md:px-8 xl:px-0">{body}</main>
    </PageShell>
  );
}
