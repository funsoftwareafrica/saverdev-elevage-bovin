"use client";

// AppShell — shell client qui utilise la session réelle (useSession).
// Remplace l'ancien page.tsx qui utilisait un mock Zustand pour le rôle.
import { useSession, signOut } from "next-auth/react";
import { useMemo } from "react";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_VIEWS, type ViewKey, type Role } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { SaverdevLogo } from "@/components/saverdev-logo";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppHeader } from "@/components/app/app-header";
import { AppFooter } from "@/components/app/app-footer";
import { DashboardView } from "@/components/views/dashboard-view";
import { BovinsView } from "@/components/views/bovins-view";
import { FicheBovinView } from "@/components/views/fiche-bovin-view";
import { AlimentationView } from "@/components/views/alimentation-view";
import { DepensesView } from "@/components/views/depenses-view";
import { VentesView } from "@/components/views/ventes-view";
import { RentabiliteView } from "@/components/views/rentabilite-view";
import { FinancementView } from "@/components/views/financement-view";
import { TresorerieView } from "@/components/views/tresorerie-view";
import { PeseesView } from "@/components/views/pesees-view";
import { ParametresView } from "@/components/views/parametres-view";
import { RapportBailleurView } from "@/components/views/rapport-bailleur-view";
import { PaturagesView } from "@/components/views/paturages-view";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VIEW_TITLES: Record<ViewKey, string> = {
  dashboard: "Tableau de bord",
  bovins: "Cheptel — Bovins",
  "fiche-bovin": "Fiche bovin",
  alimentation: "Alimentation",
  depenses: "Dépenses d'exploitation",
  ventes: "Ventes & sorties",
  rentabilite: "Rentabilité",
  financement: "Financement & Bailleur",
  tresorerie: "Prévisions de trésorerie",
  pesees: "Pesées connectées",
  parametres: "Paramètres & seuils",
  rapport: "Rapport bailleur",
  paturages: "Pâturages",
};

const VIEW_COMPONENTS: Record<ViewKey, React.ComponentType> = {
  dashboard: DashboardView,
  bovins: BovinsView,
  "fiche-bovin": FicheBovinView,
  alimentation: AlimentationView,
  depenses: DepensesView,
  ventes: VentesView,
  rentabilite: RentabiliteView,
  financement: FinancementView,
  tresorerie: TresorerieView,
  pesees: PeseesView,
  parametres: ParametresView,
  rapport: RapportBailleurView,
  paturages: PaturagesView,
};

export function AppShell() {
  const { data: session, status } = useSession();
  const view = useAppStore((s) => s.view);
  const selectedBovinId = useAppStore((s) => s.selectedBovinId);

  // Pendant le chargement de la session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  // Si pas de session (ne devrait pas arriver car page.tsx filtre, mais sécurité)
  if (!session?.user) return null;

  const role = session.user.role as Role;
  const allowedViews = ROLE_VIEWS[role];
  const effectiveView: ViewKey = allowedViews.includes(view) ? view : "dashboard";
  const ViewComponent = VIEW_COMPONENTS[effectiveView];

  const subtitle =
    effectiveView === "fiche-bovin" && selectedBovinId
      ? selectedBovinId
      : ROLE_DESCRIPTIONS[role];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader
        title={VIEW_TITLES[effectiveView]}
        subtitle={subtitle}
        user={session.user}
        onLogout={() => signOut({ callbackUrl: "/" })}
      />
      <div className="flex flex-1 w-full">
        <AppSidebar activeView={effectiveView} role={role} />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={effectiveView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ViewComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
