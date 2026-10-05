"use client";

// RippleButton — bouton avec effet ripple au clic.
// Icône Hugeicons optionnelle, dégradé, glow au survol.

import { useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface RippleButtonProps {
  children: ReactNode;
  icon?: IconSvgElement;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function RippleButton({
  children,
  icon,
  variant = "primary",
  size = "md",
  className,
  onClick,
  type = "button",
  disabled = false,
}: RippleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-primary to-emerald-500 text-white shadow-[0_4px_15px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.35)]",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-border bg-transparent hover:bg-muted",
    ghost: "bg-transparent hover:bg-muted",
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-xs gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2.5",
  };

  const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button || disabled) return;

    // Créer l'effet ripple
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      transform: scale(0);
      animation: ripple-anim 0.6s ease-out;
      pointer-events: none;
    `;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    onClick?.();
  };

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative inline-flex items-center justify-center font-medium rounded-lg overflow-hidden transition-all",
        variantClasses[variant],
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {icon && <HugeiconsIcon icon={icon} size={iconSize} />}
      {children}
    </motion.button>
  );
}
