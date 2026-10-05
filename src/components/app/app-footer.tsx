"use client";

// Footer sticky — branding SAVERDEV + stats temps réel + mention légale.
// Inclut : version, statut serveur, date/heure, lien support.

import { SaverdevLogo } from "@/components/saverdev-logo";
import { HugeiconsIcon } from "@hugeicons/react";
import { Check, Bolt } from "@/lib/icons";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AppFooter() {
  const year = new Date().getFullYear();
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(
        d.toLocaleString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="mt-auto bg-secondary border-t border-border/50 print:hidden">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Logo + nom */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <SaverdevLogo size={22} variant="dark" />
            </motion.div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold">SAVERDEV</span>
              <span className="text-[0.6rem] text-muted-foreground">Sahel Vert · Développement</span>
            </div>
          </div>

          {/* Stats temps réel */}
          <div className="flex items-center gap-4 text-[0.65rem] text-muted-foreground">
            <span className="flex items-center gap-1">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-emerald-600 dark:text-emerald-400">En ligne</span>
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <HugeiconsIcon icon={Bolt} size={12} className="text-primary" />
              v1.0.0
            </span>
            <span className="hidden sm:inline tabular-nums">{time}</span>
          </div>

          {/* Mention légale */}
          <div className="text-[0.65rem] text-muted-foreground text-center sm:text-right">
            © {year} · Données sensibles — accès réservé
          </div>
        </div>
      </div>
    </footer>
  );
}
