// Store Zustand — état global de l'app (auth, rôle actif, vue courante, mois, bovin)
import { create } from "zustand";
import type { Role, ViewKey } from "./types";
import { ROLE_VIEWS } from "./types";

interface AuthUser {
  email: string;
  name: string;
  role: Role;
}

interface AppState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  role: Role;
  view: ViewKey;
  selectedBovinId: string | null;
  selectedMonth: string; // ISO "YYYY-MM"
  saisieInitialType: "achat" | "vente" | "depense" | "stock" | null;
  dashboardMode: "auto" | "BENEFICIAIRE" | "SINERGI" | "E2A"; // sélecteur de vue dashboard
  login: (user: AuthUser) => void;
  logout: () => void;
  setRole: (r: Role) => void;
  setView: (v: ViewKey) => void;
  openBovin: (id: string) => void;
  setSelectedMonth: (m: string) => void;
  setSaisieInitialType: (t: "achat" | "vente" | "depense" | "stock" | null) => void;
  setDashboardMode: (m: "auto" | "BENEFICIAIRE" | "SINERGI" | "E2A") => void;
}

const currentMonthISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  user: null,
  role: "BENEFICIAIRE",
  view: "dashboard",
  selectedBovinId: null,
  selectedMonth: currentMonthISO(),
  saisieInitialType: null,
  dashboardMode: "auto",
  login: (user) =>
    set({
      isAuthenticated: true,
      user,
      role: user.role,
      view: "dashboard",
      dashboardMode: "auto",
    }),
  logout: () =>
    set({
      isAuthenticated: false,
      user: null,
      role: "BENEFICIAIRE",
      view: "dashboard",
      selectedBovinId: null,
      saisieInitialType: null,
      dashboardMode: "auto",
    }),
  setRole: (role) =>
    set((s) => ({
      role,
      view: rolePermissions(role).includes(s.view) ? s.view : "dashboard",
      dashboardMode: "auto",
    })),
  setView: (view) => set({ view }),
  openBovin: (id) => set({ view: "fiche-bovin", selectedBovinId: id }),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setSaisieInitialType: (saisieInitialType) => set({ saisieInitialType }),
  setDashboardMode: (dashboardMode) => set({ dashboardMode }),
}));

// helper local — délègue à ROLE_VIEWS (source unique de vérité dans types.ts)
function rolePermissions(role: Role): ViewKey[] {
  return ROLE_VIEWS[role];
}
