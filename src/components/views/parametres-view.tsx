"use client";
import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewHeader } from "./_shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useParams, useUpdateParam } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { Settings, Check, Lock, CalendarClock } from "@/lib/icons";
import { toast } from "sonner";

interface MoisClotureItem {
  id: string;
  mois: string;          // "YYYY-MM"
  cloture: boolean;
  cloturePar: string | null;
  dateCloture: string | null;
}

// Labels courts des mois en français (pour l'affichage UI).
const MOIS_LABELS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];

/** Convertit "2025-10" en "Oct. 2025" (ou renvoie la chaîne brute si échec). */
function formatMoisLabel(mois: string): string {
  const [y, m] = mois.split("-");
  const idx = parseInt(m, 10) - 1;
  if (idx < 0 || idx > 11) return mois;
  return `${MOIS_LABELS[idx]} ${y}`;
}

export function ParametresView() {
  const { data: params, isLoading } = useParams();
  const updateParam = useUpdateParam();
  const [values, setValues] = useState<Record<string, string>>({});
  const list = params ?? [];
  const role = useAppStore((s) => s.role);

  // ===== Task 31-B : gestion des mois clôturés =====
  const [moisClotures, setMoisClotures] = useState<MoisClotureItem[]>([]);
  const [loadingMois, setLoadingMois] = useState(true);
  const [selectedMonthInput, setSelectedMonthInput] = useState<string>("");
  const [savingMois, setSavingMois] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const v: Record<string, string> = {}; list.forEach((p) => { v[p.cle] = p.valeur; }); setValues(v); }, [list]);

  const loadMoisClotures = async () => {
    setLoadingMois(true);
    try {
      const res = await fetch("/api/mois-cloture", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setMoisClotures(data.mois || []);
    } catch { /* ignore */ }
    setLoadingMois(false);
  };

  // Task 31-B : charge la liste des mois clôturés au montage du composant.
  // On utilise une fonction auto-invoquée async pour ne pas appeler
  // setState directement dans le corps de l'effet (règle React 19).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMois(true);
      try {
        const res = await fetch("/api/mois-cloture", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setMoisClotures(data.mois || []);
      } catch { /* ignore */ }
      if (!cancelled) setLoadingMois(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Soumet la clôture/déclôture d'un mois (réservé E2A).
  const handleToggleCloture = async (mois: string, cloture: boolean) => {
    setSavingMois(true);
    try {
      const res = await fetch("/api/mois-cloture", {
        method: cloture ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: cloture ? undefined : JSON.stringify({ mois }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || `Erreur HTTP ${res.status}`);
        return;
      }
      toast.success(cloture ? "Mois déclôturé" : "Mois clôturé");
      await loadMoisClotures();
    } catch {
      toast.error("Connexion perdue");
    }
    setSavingMois(false);
  };

  const handleClotureInput = async () => {
    const mois = selectedMonthInput; // déjà au format "YYYY-MM"
    if (!mois) {
      toast.error("Sélectionner un mois");
      return;
    }
    await handleToggleCloture(mois, false);
    setSelectedMonthInput("");
  };

  // Seul E2A peut voir/gérer la section clôture des mois.
  const canManageCloture = role === "E2A";

  return (
    <div className="space-y-6">
      <ViewHeader title="Paramètres & seuils" description="Configurez les seuils d'alerte et la clôture des mois comptables" icon={Settings} />
      {isLoading ? <Skeleton className="h-48" /> : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Seuils d'alerte</CardTitle>
            <CardDescription className="text-xs">Ajustez les seuils déclenchant les alertes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {list.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border-b pb-3 last:border-0">
                <div className="flex-1"><p className="text-sm font-medium">{p.description ?? p.cle}</p></div>
                <Input value={values[p.cle] ?? ""} onChange={(e) => setValues({ ...values, [p.cle]: e.target.value })} className="w-32 h-8 text-sm" />
                <Button size="sm" variant="ghost" onClick={() => updateParam.mutate({ cle: p.cle, valeur: values[p.cle] ?? "" }, { onSuccess: () => toast.success("Paramètre mis à jour") })}>
                  <HugeiconsIcon icon={Check} size={16} />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ===== Task 31-B : Gestion des mois clôturés (verrouillage comptable) ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <HugeiconsIcon icon={CalendarClock} size={16} className="text-primary" /> Clôture des mois comptables
          </CardTitle>
          <CardDescription className="text-xs">
            Verrouillez les saisies sur un mois clos. Tant qu'un mois est clôturé, POST /api/saisie répondra HTTP 403 « Mois clôturé, saisie impossible ».
            {!canManageCloture && " (réservé au rôle E2A)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulaire de clôture d'un nouveau mois */}
          {canManageCloture && (
            <div className="flex items-end gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs uppercase text-muted-foreground">Clôturer un mois</label>
                <Input
                  type="month"
                  value={selectedMonthInput}
                  onChange={(e) => setSelectedMonthInput(e.target.value)}
                  className="h-9 text-sm"
                  disabled={savingMois}
                />
              </div>
              <Button
                onClick={handleClotureInput}
                disabled={savingMois || !selectedMonthInput}
                size="sm"
                className="bg-primary"
              >
                <HugeiconsIcon icon={Lock} size={14} /> Clôturer
              </Button>
            </div>
          )}

          {/* Liste des mois clôturés/ouverts */}
          {loadingMois ? (
            <Skeleton className="h-24" />
          ) : moisClotures.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
              Aucun mois clôturé pour le moment.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {moisClotures.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{formatMoisLabel(m.mois)}</p>
                    <p className="text-[0.65rem] text-muted-foreground">
                      {m.cloturePar ? `Clôturé par ${m.cloturePar}` : "N/A"}
                      {m.dateCloture ? ` · ${new Date(m.dateCloture).toLocaleString("fr-FR")}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={m.cloture
                      ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                      : "text-amber-700 border-amber-300 bg-amber-50"}
                  >
                    {m.cloture ? "Clôturé" : "Ouvert"}
                  </Badge>
                  {canManageCloture && (
                    <Button
                      size="sm"
                      variant={m.cloture ? "outline" : "default"}
                      onClick={() => handleToggleCloture(m.mois, m.cloture)}
                      disabled={savingMois}
                      className="h-8"
                    >
                      {m.cloture ? "Déclôturer" : "Clôturer"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Légende informative */}
          <p className="text-[0.65rem] text-muted-foreground italic">
            Astuce : un mois clôturé empêche toute nouvelle saisie (achats, ventes, dépenses, stock, investissement, capital). La déclôture rouvre le mois — utile pour des corrections post-clôture.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
