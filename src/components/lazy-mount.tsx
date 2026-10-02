"use client";

// LazyMount — ne rend ses enfants que lorsqu'ils entrent dans le viewport.
// Optimisation : les graphiques lourds (Recharts) hors écran ne sont pas montés
// au chargement initial, réduisant le TTI et la charge GPU/CPU.
//
// Usage :
//   <LazyMount height={288} fallback={<Skeleton className="h-72" />}>
//     <HeavyChart />
//   </LazyMount>

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LazyMountProps {
  children: ReactNode;
  /** Hauteur du placeholder avant montage (évite le saut de layout). */
  height?: number | string;
  /** Skeleton/placeholder affiché avant l'entrée dans le viewport. */
  fallback?: ReactNode;
  /** Root margin pour déclenner le montage un peu avant l'arrivée. */
  rootMargin?: string;
  className?: string;
}

export function LazyMount({
  children,
  height,
  fallback,
  rootMargin = "200px 0px",
  className,
}: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Initialise à true si IntersectionObserver n'est pas dispo (SSR/vieux nav)
  // → évite un setState synchrone dans l'effect (lint react-hooks/set-state-in-effect)
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return typeof IntersectionObserver === "undefined";
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={height != null ? { minHeight: typeof height === "number" ? `${height}px` : height } : undefined}
    >
      {visible ? children : fallback ?? null}
    </div>
  );
}
