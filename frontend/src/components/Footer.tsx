import { Globe } from "lucide-react";
import Link from "next/link";
import { DESTINATIONS } from "@/lib/destinations";

const COLUMNS = [
  { title: "Support", links: ["Help centre", "Safety information", "Cancellation options", "Report a concern"] },
  { title: "Hosting", links: ["Host your home", "Hosting resources", "Community forum", "Hosting responsibly"] },
  { title: "staybnb", links: ["About", "Newsroom", "Careers", "Investors"] },
];

export function Footer() {
  return (
    <footer className="mt-16 bg-surface-subtle pb-24 md:pb-8">
      <div className="px-6 pt-12 md:px-8 xl:px-12">
        <div className="border-b border-line pb-8">
          <h2 className="mb-4 text-md font-semibold">Inspiration for future getaways</h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            {DESTINATIONS.map((d) => (
              <li key={d.name}>
                <Link href={`/s?location=${encodeURIComponent(d.name)}`} className="block hover:underline">
                  <span className="block text-base font-medium">{d.name}</span>
                  <span className="block text-base text-ink-secondary">Homes and stays</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {COLUMNS.map((c) => (
            <div key={c.title} className="border-b border-line pb-6 md:border-0 md:pb-0">
              <h3 className="mb-4 text-base font-semibold">{c.title}</h3>
              <ul className="space-y-4 text-base">
                {c.links.map((l) => (
                  <li key={l}>
                    <Link href="#" className="hover:underline">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-base md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} staybnb · Privacy · Terms · Company details · A demo project, not affiliated with any travel company
          </p>
          <div className="flex items-center gap-5 font-medium">
            <span className="flex items-center gap-2"><Globe size={16} aria-hidden /> English (IN)</span>
            <span>₹ INR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
