import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import { INTRO_SCRIPT } from "./(public)/_intro/introScript";
import "./globals.css";

// Designed for low-vision readers: legible for a very broad public.
const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Avis des usagers",
  description:
    "Donnez votre avis sur un établissement : anonyme, gratuit, environ une minute.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-intro is set by INTRO_SCRIPT before React starts: hence suppressHydrationWarning.
    <html lang="fr" className={atkinson.variable} suppressHydrationWarning>
      <head>
        {/* A plain inline script, not next/script: it must run before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
