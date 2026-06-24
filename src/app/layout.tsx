import type { Metadata, Viewport } from "next";
import { SkipLink } from "@/components/ui/SkipLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tesla Supercharger Intelligence Map",
  description:
    "Live Tesla Supercharger occupancy, congestion signals, and energy portfolio intelligence worldwide.",
  keywords: [
    "Tesla",
    "Supercharger",
    "EV charging",
    "live occupancy",
    "congestion",
    "solar",
    "battery",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Supercharger Map",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0e17",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}