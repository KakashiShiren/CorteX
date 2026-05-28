import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";

import "@/app/globals.css";

import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Grove — Your Campus. Your People.",
  description:
    "Grove is the verified student social platform for your university. Find your people, discover events, and make the most of campus life."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans text-[15px] text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}