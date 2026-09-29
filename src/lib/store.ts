// Store Zustand — état global de l'app (rôle actif, vue courante, mois sélectionné, bovin sélectionné)
import { create } from "zustand";
import type { Role, ViewKey } from "./types";

interface AppState {
  role: Role;
  view: ViewKey;
  selectedBovinId: string | null;
  selectedMonth: string; // ISO "YYYY-MM"
  setRole: (r: Role) => void;
  setView: (v: ViewKey) => void;
  openBovin: (id: string) => void;
  setSelectedMonth: (m: string) => void;
}

const currentMonthISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const useAppStore = create<AppState>((set) => ({
  role: "GERANT",
  view: "dashboard",
  selectedBovinId: null,
  selectedMonth: currentMonthISO(),
  setRole: (role) =>
    set((s) => ({
      role,
      // si la vue courante n'est pas accessible au nouveau rôle, fallback dashboard
      view: rolePermissions(role).includes(s.view) ? s.view : "dashboard",
    })),
  setView: (view) => set({ view }),
  openBovin: (id) => set({ view: "fiche-bovin", selectedBovinId: id }),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
}));

// helper local (évite d'importer ROLE_VIEWS partout)
function rolePermissions(role: Role): ViewKey[] {
  const m: Record<Role, ViewKey[]> = {
    ELEVEUR: ["dashboard", "bovins", "alimentation", "depenses", "ventes"],
    GERANT: ["dashboard", "bovins", "alimentation", "depenses", "ventes", "rentabilite", "financement", "rapport"],
    BAILLEUR: ["dashboard", "rentabilite", "financement", "rapport"],
    ADMIN: ["dashboard", "bovins", "alimentation", "depenses", "ventes", "rentabilite", "financement", "rapport"],
  };
  return m[role];
}
