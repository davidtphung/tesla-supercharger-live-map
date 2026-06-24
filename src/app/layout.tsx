import type { Metadata, Viewport } from "next";
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e17",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}