"use client";

// Footer sticky — branding SAVERDEV + mention légale.

import { SaverdevLogo } from "@/components/saverdev-logo";

export function AppFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto bg-secondary text-secondary-foreground print:hidden">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SaverdevLogo size={22} variant="dark" />
            <span className="text-xs font-medium">SAVERDEV · Sahel Vert pour un Développement Durable</span>
          </div>
          <div className="text-[0.7rem] text-secondary-foreground/70 text-center sm:text-right">
            © {year} · Application de gestion d'élevage bovin · Données sensibles — accès réservé
          </div>
        </div>
      </div>
    </footer>
  );
}
