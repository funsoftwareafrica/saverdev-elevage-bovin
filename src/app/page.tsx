"use client";

// Shell principal de l'application SAVERDEV Élevage Bovin.
// Layout : sidebar gauche (marron terre) + header sticky + contenu + footer sticky.
// Routeur de vues par état local (Zustand) — pas de routing Next.js (single page).
// Rôles : Éleveur / Gérant / Bailleur (lecture seule) / Admin.

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_VIEWS, type ViewKey } from "@/lib/types";
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
import { RapportBailleurView } from "@/components/views/rapport-bailleur-view";

const VIEW_TITLES: Record<ViewKey, string> = {
  dashboard: "Tableau de bord",
  bovins: "Cheptel — Bovins",
  "fiche-bovin": "Fiche bovin",
  alimentation: "Alimentation",
  depenses: "Dépenses d'exploitation",
  ventes: "Ventes & sorties",
  rentabilite: "Rentabilité",
  financement: "Financement & Bailleur",
  rapport: "Rapport bailleur",
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
  rapport: RapportBailleurView,
};

export default function Home() {
  const role = useAppStore((s) => s.role);
  const view = useAppStore((s) => s.view);
  const selectedBovinId = useAppStore((s) => s.selectedBovinId);

  const allowedViews = ROLE_VIEWS[role];
  const effectiveView: ViewKey = allowedViews.includes(view) ? view : "dashboard";
  const ViewComponent = VIEW_COMPONENTS[effectiveView];

  const subtitle = useMemo(() => {
    if (effectiveView === "fiche-bovin" && selectedBovinId) return selectedBovinId;
    return ROLE_DESCRIPTIONS[role];
  }, [effectiveView, selectedBovinId, role]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader title={VIEW_TITLES[effectiveView]} subtitle={subtitle} />
      <div className="flex flex-1 w-full">
        <AppSidebar activeView={effectiveView} role={role} />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6">
            <ViewComponent />
          </div>
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
