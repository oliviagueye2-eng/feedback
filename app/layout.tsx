import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import { INTRO_SCRIPT } from "./(public)/_intro/introScript";
import { defaultLocale, getDictionary } from "./_i18n";
import "./globals.css";

// Designed for low-vision readers: legible for a very broad public.
const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

export async function generateMetadata(): Promise<Metadata> {
  const { meta, header } = await getDictionary();
  return {
    title: meta.title,
    description: meta.description,
    // Preview shown when the link is shared (WhatsApp, Facebook…).
    openGraph: { title: meta.title, description: meta.description, siteName: header.siteName, locale: "fr_SN", type: "website" },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-intro is set by INTRO_SCRIPT before React starts: hence suppressHydrationWarning.
    <html lang={defaultLocale} className={atkinson.variable} suppressHydrationWarning>
      <head>
        {/* A plain inline script, not next/script: it must run before the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
