// app/layout.tsx

import type {Metadata} from "next";
import {Geist, Geist_Mono, Outfit} from "next/font/google";
import "./globals.css";
import {ThemeProvider} from "@/components/theme-provider";
import Navigation from "./Navigation"


const outfit = Outfit({subsets: ["latin"], variable: "--font-sans"});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Michael Repolusk",
  description:
    "Willkommen auf meiner Homepage. Hier sieht man was ich in meinem Leben gemachtg habe, meine Ziele, wo hin ich will.",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={outfit.variable} suppressHydrationWarning>
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
    <ThemeProvider>
      <Navigation />
      {children}
    </ThemeProvider>
    </body>
    </html>
  );
}
