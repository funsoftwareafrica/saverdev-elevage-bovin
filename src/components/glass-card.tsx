"use client";

// GlassCard — carte avec effet verre dépoli (glassmorphism).
// Utilisée pour les éléments importants du dashboard et des vues.

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useRef } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: "default" | "primary" | "accent";
  withGlow?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = "default",
  withGlow = false,
  ...props
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const variantClasses = {
    default: "bg-white/70 dark:bg-slate-800/70",
    primary: "bg-primary/[0.06] dark:bg-primary/10",
    accent: "bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-900/20 dark:to-teal-900/10",
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/30 dark:border-white/10 backdrop-blur-xl shadow-lg",
        variantClasses[variant],
        withGlow && "glow-soft",
        className
      )}
      {...props}
    >
      {/* Reflet lumineux qui suit la position */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.1) 100%)",
        }}
      />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
