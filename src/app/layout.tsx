import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import "./globals.css";

// The two typefaces from the Figma design: Playfair Display for headings,
// Inter for everything else.
const display = Playfair_Display({ subsets: ["latin"], weight: ["500", "700"], variable: "--nf-display" });
const text = Inter({ subsets: ["latin"], variable: "--nf-text" });

export const metadata: Metadata = {
  title: { default: "Marketplace", template: "%s · Marketplace" },
  description: "Buy and sell preloved items in your community. No account needed.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
