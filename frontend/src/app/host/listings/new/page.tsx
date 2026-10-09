"use client";

import { useEffect } from "react";
import { HostGate } from "@/components/host/HostGate";
import { ListingForm } from "@/components/host/ListingForm";
import { PageShell } from "@/components/PageShell";

export default function NewListingPage() {
  useEffect(() => {
    document.title = "Create listing | staybnb";
  }, []);
  return (
    <HostGate>
      {() => (
        <PageShell>
          <main className="mx-auto max-w-content px-6 pb-8 pt-8 md:px-8 xl:px-0">
            <h1 className="mx-auto mb-8 max-w-[720px] text-2xl font-semibold">Create a listing</h1>
            <ListingForm />
          </main>
        </PageShell>
      )}
    </HostGate>
  );
}
