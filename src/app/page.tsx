"use client";

// Shell principal de l'application SAVERDEV Élevage Bovin.
// Routeur de vues par état local (Zustand) — pas de routing Next.js (single page).
// Rôles : Bénéficiaire / SINERGI SA / E2A.

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { ROLE_DESCRIPTIONS, ROLE_VIEWS, type ViewKey } from "@/lib/types";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppHeader } from "@/components/app/app-header";
import { AppFooter } from "@/components/app/app-footer";
import { LoginView } from "@/components/views/login-view";
import { SaisieView } from "@/components/views/saisie-view";
import { AnimatedBackground } from "@/components/animated-background";
import { NetworkStatus } from "@/components/network-status";
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
import { PaturagesView } from "@/components/views/paturages-view";
import { RapportBailleurView } from "@/components/views/rapport-bailleur-view";
import { BailleurSyntheseView } from "@/components/views/bailleur-synthese-view";
import { Carte3DView } from "@/components/views/carte-3d-view";
import { motion, AnimatePresence } from "framer-motion";

const VIEW_TITLES: Record<ViewKey, string> = {
  dashboard: "Tableau de bord",
  saisie: "Saisie des opérations",
  bovins: "Cheptel (Bovins + Ovins)",
  "fiche-bovin": "Fiche bovin",
  alimentation: "Alimentation",
  depenses: "Dépenses d'exploitation",
  ventes: "Ventes & sorties",
  rentabilite: "Rentabilité",
  financement: "Financement & Bailleur",
  tresorerie: "Prévisions de trésorerie",
  pesees: "Pesées connectées",
  parametres: "Paramètres & seuils",
  paturages: "Pâturages",
  rapport: "Rapport bailleur",
  "bailleur-synthese": "Synthèse bailleur",
  "carte-3d": "Carte 3D — Exploitation",
};

const VIEW_COMPONENTS: Record<ViewKey, React.ComponentType> = {
  dashboard: DashboardView,
  saisie: SaisieView,
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
  paturages: PaturagesView,
  rapport: RapportBailleurView,
  "bailleur-synthese": BailleurSyntheseView,
  "carte-3d": Carte3DView,
};

export default function Home() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const role = useAppStore((s) => s.role);
  const view = useAppStore((s) => s.view);
  const selectedBovinId = useAppStore((s) => s.selectedBovinId);

  const allowedViews = ROLE_VIEWS[role];
  const effectiveView: ViewKey = allowedViews.includes(view) ? view : allowedViews[0] ?? "dashboard";
  const ViewComponent = VIEW_COMPONENTS[effectiveView];

  const subtitle = useMemo(() => {
    if (effectiveView === "fiche-bovin" && selectedBovinId) return selectedBovinId;
    return ROLE_DESCRIPTIONS[role];
  }, [effectiveView, selectedBovinId, role]);

  // Page de connexion si non authentifié (après tous les hooks)
  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <NetworkStatus />
      <AppHeader title={VIEW_TITLES[effectiveView]} subtitle={subtitle} />
      <div className="flex flex-1 w-full">
        <AppSidebar activeView={effectiveView} role={role} />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={effectiveView}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
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
