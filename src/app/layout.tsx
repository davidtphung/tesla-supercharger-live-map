import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SkipLink } from "@/components/ui/SkipLink";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

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
  themeColor: "#000000",
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('tesla-sc-theme');
    var mode = 'dark';
    if (stored) {
      var parsed = JSON.parse(stored);
      mode = parsed.state && parsed.state.mode ? parsed.state.mode : 'dark';
    }
    var resolved = mode === 'light' ? 'light' : 'dark';
    if (mode === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = resolved;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#000000' : '#f3f4f6');
  } catch (e) {
    document.documentElement.dataset.theme = 'dark';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable}`}>
        <SkipLink />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}