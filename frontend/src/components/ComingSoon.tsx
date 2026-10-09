import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { PageShell } from "./PageShell";

export function ComingSoon({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <PageShell>
      <main className="mx-auto max-w-content px-6 py-24 text-center md:px-8">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-surface-control">
          <Icon size={28} />
        </span>
        <h1 className="mt-6 text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-md text-ink-secondary">{body}</p>
        <p className="mt-6 inline-block rounded-chip bg-surface-subtle px-4 py-2 text-base font-medium">Coming soon</p>
        <div className="mt-8">
          <Link href="/" className="rounded-md bg-ink px-6 py-3.5 text-md font-medium text-white">
            Back to exploring
          </Link>
        </div>
      </main>
    </PageShell>
  );
}
