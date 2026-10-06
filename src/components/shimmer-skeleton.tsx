"use client";

// ShimmerSkeleton — skeleton avec effet shimmer (brillance qui défile).
// Remplace le Skeleton statique pour un chargement plus vivant.

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShimmerSkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

export function ShimmerSkeleton({
  className,
  rounded = "md",
}: ShimmerSkeletonProps) {
  const roundedClass = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[rounded];

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        roundedClass,
        className
      )}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
