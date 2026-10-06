"use client";

// EmptyStateIllustration — illustrations SVG personnalisées pour empty states.
// Pas d'emojis, uniquement du SVG inline avec la palette SAVERDEV.

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  variant?: "bovin" | "vente" | "alimentation" | "search" | "default";
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyStateIllustration({
  variant = "default",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-4", className)}>
      {/* Illustration SVG */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-4"
      >
        <div className="relative h-20 w-20 flex items-center justify-center">
          {/* Halo */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/10 blur-xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Cercle principal */}
          <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
            <Illustration variant={variant} />
          </div>
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm font-semibold text-foreground"
      >
        {title}
      </motion.h3>
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-muted-foreground mt-1 max-w-sm"
        >
          {description}
        </motion.p>
      )}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}

// Illustration SVG selon le contexte
function Illustration({ variant }: { variant: string }) {
  const stroke = "var(--primary)";
  const sw = 2;

  switch (variant) {
    case "bovin":
      // Tête de bovin stylisée
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 10L4 7M18 10L20 7" />
          <path d="M6 10c0-2 2-4 6-4s6 2 6 4-2 6-6 6-6-4-6-6z" />
          <circle cx="9.5" cy="11" r="0.5" fill={stroke} />
          <circle cx="14.5" cy="11" r="0.5" fill={stroke} />
          <path d="M10 14c0 1 1 1.5 2 1.5s2-0.5 2-1.5" />
        </svg>
      );
    case "vente":
      // Graphique de vente (flèche montante)
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l5-5 4 3 7-7" />
          <path d="M15 8h4v4" />
          <path d="M3 21h18" />
        </svg>
      );
    case "alimentation":
      // Sac d'aliment
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 4h8l-1 3h-6z" />
          <path d="M7 7h10l-1 13H8z" />
          <path d="M9 12h6" />
        </svg>
      );
    case "search":
      // Loupe
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    default:
      // Document/vide
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3v5h5" />
          <path d="M19 8v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5z" />
          <path d="M9 13h6M9 17h4" />
        </svg>
      );
  }
}
