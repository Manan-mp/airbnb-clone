import { Footer } from "./Footer";
import { Header } from "./Header";

/** Plain header + content + footer for utility pages (trips, wishlists, booking...). */
export function PageShell({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) {
  return (
    <>
      <Header variant="plain" />
      {children}
      {footer && <Footer />}
    </>
  );
}
