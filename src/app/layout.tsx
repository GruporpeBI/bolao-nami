import type { Metadata } from "next";
import { Roboto_Condensed, Pacifico } from "next/font/google";
import "./globals.css";
import WorldCupTicker from "@/components/WorldCupTicker";
import NavBar from "@/components/NavBar";

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-cond",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Bolão Copa 2026 — Nami",
  description: "Faça seus palpites, apareça no Nami durante os jogos e dispute o ranking da Copa do Mundo 2026.",
  keywords: ["bolão", "copa do mundo 2026", "nami", "palpites", "ranking"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${robotoCondensed.variable} ${pacifico.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#1A0C04] text-[#F0EADD]">
        <WorldCupTicker />
        <NavBar />
        {children}
      </body>
    </html>
  );
}
