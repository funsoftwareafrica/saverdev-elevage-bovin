"use client";

// ThemeToggle — bouton de bascule mode sombre/clair.
// Icône Hugeicons Sun (clair) / Moon (sombre) avec animation de rotation.

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun, Moon } from "@/lib/icons";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  // mounted évite l'hydration mismatch (next-themes nécessite ce pattern)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-8" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 relative overflow-hidden"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Mode clair" : "Mode sombre"}
      title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      <motion.div
        key={isDark ? "moon" : "sun"}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <HugeiconsIcon
          icon={isDark ? Moon : Sun}
          size={16}
          className="text-muted-foreground"
        />
      </motion.div>
    </Button>
  );
}
