import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAVERDEV — Gestion Élevage Bovin",
  description:
    "Application de gestion et reporting d'élevage bovin d'engraissement : cheptel, alimentation, rentabilité, financement bailleur.",
  keywords: ["élevage bovin", "engraissement", "SAVERDEV", "Sahel", "gestion cheptel", "reporting bailleur"],
  authors: [{ name: "SAVERDEV" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
