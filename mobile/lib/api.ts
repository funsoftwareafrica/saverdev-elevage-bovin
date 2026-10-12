// Hooks React Query vers l'API Next.js :3000
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_URL } from "@/constants/config";
import type { Dashboard, Bovin, NotificationItem } from "./types";

async function fetchJson<T>(path: string): Promise<T> {
  const r = await fetch(`${API_URL}${path}`);
  if (!r.ok) throw new Error(`API ${path} → ${r.status}`);
  return r.json() as Promise<T>;
}

export function useDashboard() {
  return useQuery<Dashboard>({ queryKey: ["dashboard"], queryFn: () => fetchJson<Dashboard>("/api/dashboard") });
}
export function useBovins() {
  return useQuery<Bovin[]>({ queryKey: ["bovins"], queryFn: () => fetchJson<Bovin[]>("/api/bovins") });
}

export interface NotifsResponse { items: NotificationItem[]; nonLues: number }
export function useNotifications() {
  return useQuery<NotifsResponse>({ queryKey: ["notifications"], queryFn: () => fetchJson<NotifsResponse>("/api/notifications"), refetchInterval: 60_000 });
}
export function useMarkAllNotifsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API_URL}/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!r.ok) throw new Error("Échec");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

/** Saisie rapide mobile — POST /api/saisie avec type achat/vente/depense/pesee.
 *  Note: côté serveur, un BENEFICIAIRE déclenche un workflow de validation
 *  E2A ; la saisie restera en file d'attente tant qu'elle n'est pas validée. */
export function useCreateSaisieRapide() {
  return useMutation({
    mutationFn: async (data: { type: "achat" | "vente" | "depense" | "stock" } & Record<string, unknown>) => {
      const r = await fetch(`${API_URL}/api/saisie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(`Échec saisie → ${r.status}`);
      return r.json();
    },
  });
}

/** Pesée rapide — POST /api/pesees (mode connecté sur mobile via balance Bluetooth). */
export function useCreatePeseeRapide() {
  return useMutation({
    mutationFn: async (data: { bovinId: string; poids: number; methode?: string }) => {
      const r = await fetch(`${API_URL}/api/pesees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Échec pesée");
      return r.json();
    },
  });
}
