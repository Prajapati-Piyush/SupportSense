import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SupportSense",
    template: "%s · SupportSense",
  },
  description:
    "An AI support copilot that drafts only with evidence, always shows its sources, and never sends without a human.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f12" },
  ],
};

/** Applied before paint so a dark-mode reader never sees a white flash. */
const themeScript = `
try {
  var stored = localStorage.getItem('supportsense-theme') || 'system';
  var dark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only rounded-md border border-line bg-surface px-3 py-2 text-[13px] font-medium focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100]"
        >
          Skip to main content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
