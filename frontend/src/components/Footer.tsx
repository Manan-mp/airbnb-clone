import Link from "next/link";

const COLUMNS = [
  { title: "Support", links: ["Help centre", "Safety information", "Cancellation options", "Report a concern"] },
  { title: "Hosting", links: ["Host your home", "Hosting resources", "Community forum", "Hosting responsibly"] },
  { title: "staybnb", links: ["About", "Newsroom", "Careers", "Investors"] },
];

export function Footer() {
  return (
    <footer className="mt-16 bg-surface-subtle pb-24 md:pb-8">
      <div className="px-6 pt-12 md:px-8 xl:px-12">
        <div className="grid gap-8 md:grid-cols-3">
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
            © {new Date().getFullYear()} staybnb · Privacy · Terms · A demo project, not affiliated with any travel company
          </p>
          <p className="font-medium">English (IN) · ₹ INR</p>
        </div>
      </div>
    </footer>
  );
}
