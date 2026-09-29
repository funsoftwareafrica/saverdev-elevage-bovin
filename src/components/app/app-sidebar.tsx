"use client";

// Sidebar marron terre — navigation principale filtrée par rôle.

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { ROLE_LABELS, ROLE_VIEWS, type Role, type ViewKey } from "@/lib/types";
import { SaverdevLogo } from "@/components/saverdev-logo";
import { cn } from "@/lib/utils";
import {
  Activity,
  Database,
  Package,
  CreditCard,
  TrendingUp,
  BarChart3,
  Clock,
  FileText,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Icônes alignées sur le set cattly.io (Lucide outline, stroke-width 2, viewBox 24×24) :
// Activity (métriques), Database (records), Package (inventaire), CreditCard (billing),
// TrendingUp (croissance), BarChart3 (charts), Clock (échéances), FileText (documents).
const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Tableau de bord", icon: Activity },
  { key: "bovins", label: "Bovins", icon: Database },
  { key: "alimentation", label: "Alimentation", icon: Package },
  { key: "depenses", label: "Dépenses", icon: CreditCard },
  { key: "ventes", label: "Ventes", icon: TrendingUp },
  { key: "rentabilite", label: "Rentabilité", icon: BarChart3 },
  { key: "financement", label: "Financement", icon: Clock },
  { key: "rapport", label: "Rapport bailleur", icon: FileText },
];

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
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          activeView === item.key || (item.key === "bovins" && activeView === "fiche-bovin");
        return (
          <button
            key={item.key}
            onClick={() => handleSelect(item.key)}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive &&
                "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
            )}
          >
            <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
            <span className="flex-1 text-left">{item.label}</span>
            {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
          </button>
        );
      })}
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
