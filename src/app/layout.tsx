import type { Metadata } from "next";
import { Poppins, Fraunces } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://melera.vercel.app";
const SITE_TITLE = "Melera | Miel Artesanal";
const SITE_DESCRIPTION =
  "Miel pura de abejas, producida por Apícola Mercedes en Tomás Jofré, Buenos Aires. Directo del campo a tu mesa.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: "Melera",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/melera-og-clara.png",
        width: 1200,
        height: 630,
        alt: "Melera — Miel Artesanal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/melera-og-clara.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body
        className={`${poppins.variable} ${fraunces.variable} flex min-h-screen flex-col font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
