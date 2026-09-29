import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
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
    <html lang="fr" className={atkinson.variable}>
      <body>{children}</body>
    </html>
  );
}
