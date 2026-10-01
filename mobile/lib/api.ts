// Hooks React Query vers l'API Next.js :3000
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/constants/config";
import type { Dashboard, Bovin } from "./types";

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
