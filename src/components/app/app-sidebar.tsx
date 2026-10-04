"use client";

// Sidebar marron terre — navigation principale filtrée par rôle.

import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { ROLE_VIEWS, type Role, type ViewKey } from "@/lib/types";
import { NAV_ITEMS, ROLE_LABELS } from "@/lib/config";
import { SaverdevLogo } from "@/components/saverdev-logo";
import { cn } from "@/lib/utils";
import { ChevronRight, Menu, Shield } from "@/lib/icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  activeView: ViewKey;
  role: Role;
}

export function AppSidebar({ activeView, role }: Props) {
  const setView = useAppStore((s) => s.setView);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const allowedKeys = new Set(ROLE_VIEWS[role]);
  const items = NAV_ITEMS.filter((i) => allowedKeys.has(i.key));

  const handleSelect = (key: ViewKey) => {
    setView(key);
    setOpen(false);
  };

  const navList = (
    <nav className="flex flex-col gap-1 px-3">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
        className="flex flex-col gap-1"
      >
        {items.map((item) => {
          const isActive =
            activeView === item.key || (item.key === "bovins" && activeView === "fiche-bovin");
          return (
            <motion.button
              key={item.key}
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0 },
              }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ x: 4, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(item.key)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all overflow-hidden",
                isActive
                  ? "bg-primary/15 text-white border-l-[3px] border-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white border-l-[3px] border-transparent"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-sidebar-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <HugeiconsIcon icon={item.icon} size={18} className="shrink-0 relative z-10" />
              <span className="flex-1 text-left relative z-10">{item.label}</span>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                >
                  <HugeiconsIcon icon={ChevronRight} size={16} className="opacity-70" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
      <SaverdevLogo size={42} />
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-sidebar-foreground text-[0.95rem] tracking-wide">SAVERDEV</span>
        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-sidebar-accent-foreground/70">
          Sahel Vert · Développement
        </span>
      </div>
    </div>
  );

  const roleBadge = (
    <div className="px-5 py-4 border-t border-sidebar-border mt-auto">
      <div className="text-[0.62rem] uppercase tracking-[0.15em] text-sidebar-accent-foreground/60 mb-1">
        Connecté en tant que
      </div>
      <div className="text-sm font-semibold text-sidebar-foreground">{ROLE_LABELS[role]}</div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-2 left-2 z-50 h-10 w-10 bg-sidebar text-sidebar-foreground shadow-md md:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex flex-col h-full">
            {brand}
            <div className="flex-1 overflow-y-auto scroll-thin-dark py-4">{navList}</div>
            {roleBadge}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-sidebar text-sidebar-foreground min-h-[calc(100vh-3.5rem)] sticky top-14 self-start">
      {brand}
      <div className="flex-1 overflow-y-auto scroll-thin-dark py-4">{navList}</div>
      {roleBadge}
    </aside>
  );
}
