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
  Tresorerie, Pese, Parametre, NotificationItem, Backup, Soin, RaceStat, ComparaisonMois, Paturage,
  Dashboard, Tag, Validation, RapportBailleur,
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

// ---------- Tresorerie ----------
export function useTresorerie() { return useQuery<Tresorerie>({ queryKey: ["tresorerie"], queryFn: () => fetchJson<Tresorerie>("/api/tresorerie") }); }
// ---------- Pesees ----------
export function usePesees(bovinId?: string) { return useQuery<Pese[]>({ queryKey: ["pesees", bovinId], queryFn: () => fetchJson<Pese[]>(`/api/pesees${bovinId ? `?bovinId=${bovinId}` : ""}`) }); }
export function useCreatePese() { const qc = useQueryClient(); return useMutation({ mutationFn: async (data: { bovinId: string; poids: number; methode?: string }) => { const r = await fetch("/api/pesees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); if (!r.ok) throw new Error("Échec"); return r.json(); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["pesees"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); } }); }
// ---------- Parametres ----------
export function useParams() { return useQuery<Parametre[]>({ queryKey: ["parametres"], queryFn: () => fetchJson<Parametre[]>("/api/parametres") }); }
export function useUpdateParam() { const qc = useQueryClient(); return useMutation({ mutationFn: async (data: { cle: string; valeur: string }) => { const r = await fetch("/api/parametres", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); if (!r.ok) throw new Error("Échec"); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["parametres"] }) }); }
// ---------- Notifications ----------
export function useNotifications() { return useQuery<NotificationItem[]>({ queryKey: ["notifications"], queryFn: () => fetchJson<NotificationItem[]>("/api/notifications") }); }
// ---------- Backups ----------
export function useBackups() { return useQuery<Backup[]>({ queryKey: ["backups"], queryFn: () => fetchJson<Backup[]>("/api/backup") }); }
export function useCreateBackup() { const qc = useQueryClient(); return useMutation({ mutationFn: async () => { const r = await fetch("/api/backup", { method: "POST" }); if (!r.ok) throw new Error("Échec"); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["backups"] }) }); }
// ---------- Soins ----------
export function useSoins(bovinId?: string) { return useQuery<Soin[]>({ queryKey: ["soins", bovinId], queryFn: () => fetchJson<Soin[]>(`/api/soins${bovinId ? `?bovinId=${bovinId}` : ""}`) }); }
export function useCreateSoin() { const qc = useQueryClient(); return useMutation({ mutationFn: async (data: { bovinId: string; type: string; libelle: string; cout?: number; prochainRappel?: string; notes?: string }) => { const r = await fetch("/api/soins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); if (!r.ok) throw new Error("Échec"); return r.json(); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["soins"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); } }); }
// ---------- Stats ----------
export function useStatsRaces() { return useQuery<RaceStat[]>({ queryKey: ["stats-races"], queryFn: () => fetchJson<RaceStat[]>("/api/stats/races") }); }
export function useStatsComparaison() { return useQuery<ComparaisonMois>({ queryKey: ["stats-comparaison"], queryFn: () => fetchJson<ComparaisonMois>("/api/stats/comparaison") }); }
// ---------- Paturages ----------
export function usePaturages() { return useQuery<Paturage[]>({ queryKey: ["paturages"], queryFn: () => fetchJson<Paturage[]>("/api/paturages") }); }

// ---------- Tags ----------
export function useTags(bovinId: string | null) {
  return useQuery<Tag[]>({
    queryKey: ["tags", bovinId],
    queryFn: () => fetchJson<Tag[]>(`/api/bovins/${bovinId}/tags`),
    enabled: !!bovinId,
  });
}
export function useAddTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { bovinId: string; tag: string; color?: string }) => {
      const r = await fetch(`/api/bovins/${data.bovinId}/tags`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error("Échec"); return r.json();
    },
    onSuccess: (_, data) => { qc.invalidateQueries({ queryKey: ["tags", data.bovinId] }); },
  });
}
// ---------- Validations ----------
export function useValidations() {
  return useQuery<Validation[]>({ queryKey: ["validations"], queryFn: () => fetchJson<Validation[]>("/api/validations") });
}
export function useValidateOperation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: string; statut: "VALIDE" | "REJETE"; commentaire?: string }) => {
      const r = await fetch(`/api/validations/${data.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error("Échec"); return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["validations"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });
}

// ---------- Rapport Bailleur ----------
export function useRapportBailleur(annee?: number) {
  return useQuery<RapportBailleur>({
    queryKey: ["rapport-bailleur", annee],
    queryFn: () => fetchJson<RapportBailleur>(`/api/rapport-bailleur${annee ? `?annee=${annee}` : ""}`),
  });
}
