"use client";

// Header sticky — logo mobile, titre de la vue, sélecteur de mois, sélecteur de rôle.

import { useAppStore } from "@/lib/store";
import { HugeiconsIcon } from "@hugeicons/react";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { SaverdevLogo } from "@/components/saverdev-logo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Logout } from "@/lib/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

interface Props {
  title: string;
  subtitle: string;
}

const ROLES: Role[] = ["ELEVEUR", "GERANT", "BAILLEUR", "ADMIN"];

export function AppHeader({ title, subtitle }: Props) {
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const selectedMonth = useAppStore((s) => s.selectedMonth);
  const setSelectedMonth = useAppStore((s) => s.setSelectedMonth);

  // Génère les 12 derniers mois pour le sélecteur
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      iso,
      label: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    };
  });

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-border/80 print:hidden">
      <div className="flex h-full items-center gap-3 px-4 md:px-6 pl-16 md:pl-6">
        {/* Logo mobile compact */}
        <div className="md:hidden">
          <SaverdevLogo size={28} />
        </div>

        {/* Titre */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold leading-tight truncate">{title}</h1>
          <p className="text-[0.7rem] text-muted-foreground truncate hidden sm:block">{subtitle}</p>
        </div>

        {/* Sélecteur de mois */}
        <div className="hidden sm:flex items-center gap-1.5">
          <HugeiconsIcon icon={Calendar} size={16} className="text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.iso} value={m.iso} className="text-xs capitalize">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sélecteur de rôle (démo) */}
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={User} size={16} className="text-muted-foreground hidden sm:block" />
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="h-8 w-[120px] sm:w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r} className="text-xs">
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Badge lecture seule pour bailleur */}
        {role === "BAILLEUR" && (
          <Badge
            variant="outline"
            className="hidden lg:inline-flex text-[0.65rem] border-amber-300 text-amber-700 bg-amber-50"
          >
            Lecture seule
          </Badge>
        )}

        {/* Toggle mode sombre/clair */}
        <ThemeToggle />

        {/* Bouton déconnexion */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
          onClick={() => {
            logout();
            toast.info("Déconnexion", { description: "À bientôt sur SAVERDEV" });
          }}
          aria-label="Se déconnecter"
          title={user ? `${user.name}` : "Se déconnecter"}
        >
          <HugeiconsIcon icon={Logout} size={16} />
        </Button>
      </div>
    </header>
  );
}
