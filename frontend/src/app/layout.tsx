import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Suspense } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { BottomNav } from "@/components/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "staybnb | Holiday rentals, cabins, beach houses & more", template: "%s | staybnb" },
  description: "Find places to stay — an Airbnb-style marketplace demo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="pb-[65px] md:pb-0">
        <ToastProvider>
          <AuthProvider>
            <Suspense>{children}</Suspense>
            <BottomNav />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
