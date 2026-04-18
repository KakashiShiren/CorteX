import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";

import "@/app/globals.css";

import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Cortex | The Brain of Clark University",
  description:
    "Cortex helps Clark students navigate campus, connect with verified classmates, and get trusted campus answers in seconds."
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
