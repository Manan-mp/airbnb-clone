import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata = { title: "Page not found" };

/** Airbnb-style 404: a calm explanation, a big number and two ways out. */
export default function NotFound() {
  return (
    <>
      <Header variant="plain" />
      <main className="mx-auto flex min-h-[60vh] max-w-content flex-col justify-center px-6 py-16 md:px-8 xl:px-0">
        <p className="text-hero font-medium leading-none text-ink">404</p>
        <h1 className="mt-6 text-2xl font-semibold">We can’t seem to find the page you’re looking for.</h1>
        <p className="mt-3 max-w-[560px] text-md text-ink-secondary">
          The link may be broken or the page may have moved. Here are some helpful places to go instead.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="rounded-md bg-brand-gradient px-6 py-3.5 text-md font-medium text-white transition-transform duration-200 ease-airy active:scale-[0.98]">
            Go to the home page
          </Link>
          <Link href="/s" className="rounded-md border border-ink px-6 py-3.5 text-md font-medium transition-colors duration-200 ease-airy hover:bg-surface-subtle">
            Browse all stays
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
