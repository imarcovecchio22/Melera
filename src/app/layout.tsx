import type { Metadata } from "next";
import { Poppins, Fraunces, Caveat } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Melera | Miel Artesanal",
  description:
    "Miel pura de abejas, producida por Apícola Mercedes en Tomás Jofré, Buenos Aires. Directo del campo a tu mesa.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${poppins.variable} ${fraunces.variable} ${caveat.variable} flex min-h-screen flex-col font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
