// Hooks React (TanStack Query) — fetch les données depuis les API routes.
// Chaque hook expose { data, isLoading, error } et utilise des clés de cache stables.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Bovin,
  Alimentation,
  Depense,
  Financement,
  Alerte,
  Historique,
  Dashboard,
} from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`API ${url} → ${r.status}`);
  return r.json() as Promise<T>;
}

// ---------- Dashboard ----------
export function useDashboard() {
  return useQuery<Dashboard>({
    queryKey: ["dashboard"],
    queryFn: () => fetchJson<Dashboard>("/api/dashboard"),
  });
}

// ---------- Bovins ----------
export function useBovins() {
  return useQuery<Bovin[]>({
    queryKey: ["bovins"],
    queryFn: () => fetchJson<Bovin[]>("/api/bovins"),
  });
}

export function useBovin(id: string | null) {
  return useQuery<Bovin>({
    queryKey: ["bovin", id],
    queryFn: () => fetchJson<Bovin>(`/api/bovins/${id}`),
    enabled: !!id,
  });
}

export function useCreateBovin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      race: string;
      sexe: string;
      dateAchat: string;
      prixAchat: number;
      poidsAchat: number;
    }) => {
      const r = await fetch("/api/bovins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Échec création bovin");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bovins"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["historique"] });
    },
  });
}

// ---------- Alimentation ----------
export function useAlimentations() {
  return useQuery<Alimentation[]>({
    queryKey: ["alimentation"],
    queryFn: () => fetchJson<Alimentation[]>("/api/alimentation"),
  });
}

export function useCreateAlimentation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      produit: string;
      quantite: number;
      unite: string;
      coutTotal: number;
      nbBovinsConcernes: number;
      commentaire?: string;
      date?: string;
    }) => {
      const r = await fetch("/api/alimentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Échec création alimentation");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alimentation"] });
      qc.invalidateQueries({ queryKey: ["bovins"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["historique"] });
    },
  });
}

// ---------- Dépenses ----------
export function useDepenses() {
  return useQuery<Depense[]>({
    queryKey: ["depenses"],
    queryFn: () => fetchJson<Depense[]>("/api/depenses"),
  });
}

export function useCreateDepense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      categorie: string;
      libelle: string;
      montant: number;
      nbBovinsConcernes?: number;
      date?: string;
    }) => {
      const r = await fetch("/api/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Échec création dépense");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["depenses"] });
      qc.invalidateQueries({ queryKey: ["bovins"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["historique"] });
    },
  });
}

// ---------- Ventes ----------
export function useVentes() {
  return useQuery<Bovin[]>({
    queryKey: ["ventes"],
    queryFn: () => fetchJson<Bovin[]>("/api/ventes"),
  });
}

export function useCreateVente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      bovinId: string;
      prixVente: number;
      dateVente?: string;
      client?: string;
    }) => {
      const r = await fetch("/api/ventes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Échec enregistrement vente");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ventes"] });
      qc.invalidateQueries({ queryKey: ["bovins"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["historique"] });
    },
  });
}

// ---------- Financement ----------
export function useFinancement() {
  return useQuery<Financement | null>({
    queryKey: ["financement"],
    queryFn: () => fetchJson<Financement | null>("/api/financement"),
  });
}

// ---------- Alertes ----------
export function useAlertes() {
  return useQuery<Alerte[]>({
    queryKey: ["alertes"],
    queryFn: () => fetchJson<Alerte[]>("/api/alertes"),
  });
}

// ---------- Historique ----------
export function useHistorique() {
  return useQuery<Historique[]>({
    queryKey: ["historique"],
    queryFn: () => fetchJson<Historique[]>("/api/historique"),
  });
}
