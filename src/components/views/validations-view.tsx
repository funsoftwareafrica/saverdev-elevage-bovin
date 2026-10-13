"use client";

// Vue Validations — workflow de validation à 2 niveaux (cahier des charges §9).
//
// Affiche les saisies en attente de validation E2A :
//   - type d'opération (achat / vente / dépense / stock / capital_mouvement)
//   - détail des données saisies (désérialisé depuis Validation.action)
//   - boutons "Valider" (applique réellement l'opération en base) et
//     "Rejeter" (avec commentaire obligatoire)
//
// Réservé au rôle E2A. Les saisies proviennent du Bénéficiaire (SAVERDEV) qui
// passe par POST /api/saisie avec mise en file d'attente automatique.

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useValidations, useValidateOperation, useBovins } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { formatFCFA, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CheckCircle2, X, Clock, Beef, Receipt, ShoppingCart, Wallet, Landmark } from "@/lib/icons";
import { ViewHeader, KpiCard } from "./_shared";
import { toast } from "sonner";
import type { Validation } from "@/lib/types";

type TabKey = "EN_ATTENTE" | "VALIDEE" | "REJETEE";

const ENTITE_LABELS: Record<string, { label: string; icon: typeof Beef }> = {
  // Anciens libellés (rétro-compat) :
  ACHAT: { label: "Achat bétail", icon: Beef },
  VENTE: { label: "Vente bétail", icon: ShoppingCart },
  DEPENSE: { label: "Dépense", icon: Receipt },
  STOCK: { label: "Mouvement stock", icon: Wallet },
  CAPITAL_MOUVEMENT: { label: "Mouvement capital", icon: Landmark },
  // Nouveaux libellés (post-28-B) :
  Bovin: { label: "Achat bétail", icon: Beef },
  Vente: { label: "Vente bétail", icon: ShoppingCart },
  Depense: { label: "Dépense", icon: Receipt },
  StockMouvement: { label: "Mouvement stock", icon: Wallet },
  CapitalMouvement: { label: "Mouvement capital", icon: Landmark },
};

/** Tente de désérialiser le payload d'action stocké dans Validation.action. */
function parseAction(action: string): { type: string; data: Record<string, unknown> } | null {
  try {
    const parsed = JSON.parse(action) as { type: string; data: Record<string, unknown> };
    if (!parsed.type || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Génère un résumé lisible d'une opération à partir de son payload. */
function summarizeOperation(payload: { type: string; data: Record<string, unknown> }): string {
  const { type, data } = payload;
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));
  switch (type) {
    case "achat":
      return `${data.race ?? "—"} · ${data.sexe ?? "—"} · ${data.espece ?? "BOVIN"} · ${num(data.nbSujets ?? 1)} tête(s) · ${formatFCFA(num(data.prixUnitaire) * num(data.nbSujets ?? 1))}`;
    case "vente": {
      const prix = num(data.prixUnitaire);
      const nb = num(data.nbSujets ?? 1);
      return `${data.espece ?? "BOVIN"} · ${nb} tête(s) · ${formatFCFA(prix * nb)} · client : ${data.acheteur ?? "Client"}`;
    }
    case "depense":
      return `${data.categorie ?? "Autre"} · ${data.libelle ?? "—"} · ${formatFCFA(num(data.montant))}`;
    case "stock":
      return `${data.typeAliment ?? "Son"} · entrée ${data.entree ?? 0} · sortie ${data.sortie ?? 0} · ${formatFCFA(num(data.prixParSac))}/sac`;
    case "capital_mouvement":
      return `${data.typeMvt === "ENTREE" ? "Ajout" : "Retrait"} · ${data.libelle ?? "—"} · ${formatFCFA(num(data.montant))}`;
    default:
      return "Opération inconnue";
  }
}

export function ValidationsView() {
  const role = useAppStore((s) => s.role);
  const readOnly = role !== "E2A";
  const [tab, setTab] = useState<TabKey>("EN_ATTENTE");
  const [rejectTarget, setRejectTarget] = useState<Validation | null>(null);
  const [viewTarget, setViewTarget] = useState<Validation | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const { data: bovins } = useBovins();
  void bovins; // réservé à un éventuel select de bovin (inutilisé ici)

  // On récupère toutes les validations (statut filtré par API)
  const { data: vals, isLoading } = useValidations();
  const validateOperation = useValidateOperation();

  const allVals = vals ?? [];
  const filtered = allVals.filter((v) => v.statut === tab);
  const enAttente = allVals.filter((v) => v.statut === "EN_ATTENTE").length;
  const validees = allVals.filter((v) => v.statut === "VALIDEE").length;
  const rejettees = allVals.filter((v) => v.statut === "REJETEE").length;

  const handleValidate = (v: Validation) => {
    validateOperation.mutate(
      { id: v.id, statut: "VALIDE" },
      {
        onSuccess: (res) => {
          toast.success("Saisie validée et appliquée", {
            description: res?.identifiant ? `Entité créée : ${res.identifiant}` : "Opération appliquée en base",
          });
        },
        onError: (e: unknown) => {
          toast.error("Échec de la validation", {
            description: e instanceof Error ? e.message : "Erreur inconnue",
          });
        },
      }
    );
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    if (!rejectComment.trim()) {
      toast.error("Un commentaire est obligatoire pour refuser");
      return;
    }
    validateOperation.mutate(
      { id: rejectTarget.id, statut: "REJETE", commentaire: rejectComment.trim() },
      {
        onSuccess: () => {
          toast.success("Saisie rejetée", { description: "Le saisiePar a été notifié." });
          setRejectTarget(null);
          setRejectComment("");
        },
        onError: () => toast.error("Échec du rejet"),
      }
    );
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Validations E2A"
        description="Saisies du Bénéficiaire en attente de validation (workflow à 2 niveaux)."
        icon={Shield}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="En attente" value={enAttente} icon={Clock} variant={enAttente > 0 ? "warning" : "default"} hint="Saisies à traiter" />
        <KpiCard label="Validées (historique)" value={validees} icon={CheckCircle2} variant="success" hint="Opérations appliquées" />
        <KpiCard label="Rejetées (historique)" value={rejettees} icon={X} variant="danger" hint="Opérations refusées" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm">File d'attente de validation</CardTitle>
            <CardDescription className="text-xs">
              {readOnly
                ? "Lecture seule — seule la E2A peut valider ou rejeter."
                : "Validez pour appliquer en base · Rejetez avec un commentaire obligatoire."}
            </CardDescription>
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <TabsList className="h-8">
              <TabsTrigger value="EN_ATTENTE" className="text-xs">En attente ({enAttente})</TabsTrigger>
              <TabsTrigger value="VALIDEE" className="text-xs hidden sm:inline-flex">Validées ({validees})</TabsTrigger>
              <TabsTrigger value="REJETEE" className="text-xs hidden sm:inline-flex">Rejetées ({rejettees})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-auto scroll-thin">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Aucune saisie {tab === "EN_ATTENTE" ? "en attente" : tab === "VALIDEE" ? "validée" : "rejetée"}.
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((v) => {
                  const payload = parseAction(v.action);
                  const meta = payload ? ENTITE_LABELS[payload.type.toUpperCase()] : null;
                  const Icon = meta?.icon ?? Receipt;
                  return (
                    <li key={v.id} className="p-4 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
                          <HugeiconsIcon icon={Icon} size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{meta?.label ?? v.entiteType}</span>
                            <Badge variant="outline" className="text-[0.6rem]">
                              {v.statut === "EN_ATTENTE" ? "En attente" : v.statut === "VALIDEE" ? "Validée" : "Rejetée"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {payload ? summarizeOperation(payload) : "Données indisponibles"}
                          </p>
                          <p className="text-[0.65rem] text-muted-foreground mt-1">
                            Saisie le {formatDate(v.dateSaisie)}
                            {v.dateValidation && ` · Traité le ${formatDate(v.dateValidation)}`}
                          </p>
                          {v.commentaire && (
                            <p className="text-[0.7rem] mt-1 italic text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                              💬 {v.commentaire}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Voir les détails"
                            onClick={() => setViewTarget(v)}
                          >
                            <HugeiconsIcon icon={Receipt} size={16} />
                          </Button>
                          {!readOnly && v.statut === "EN_ATTENTE" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-emerald-700 hover:bg-emerald-50"
                                disabled={validateOperation.isPending}
                                onClick={() => handleValidate(v)}
                                title="Valider et appliquer en base"
                              >
                                <HugeiconsIcon icon={CheckCircle2} size={16} /> Valider
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:bg-red-50"
                                title="Rejeter"
                                onClick={() => {
                                  setRejectTarget(v);
                                  setRejectComment("");
                                }}
                              >
                                <HugeiconsIcon icon={X} size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog détails */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la saisie</DialogTitle>
            <DialogDescription className="text-xs">
              {viewTarget && `Saisie le ${formatDate(viewTarget.dateSaisie)}`}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Type :</span>{" "}
                <Badge variant="outline" className="text-[0.65rem]">{viewTarget.entiteType}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Statut :</span>{" "}
                <Badge variant="outline" className="text-[0.65rem]">
                  {viewTarget.statut === "EN_ATTENTE" ? "En attente" : viewTarget.statut === "VALIDEE" ? "Validée" : "Rejetée"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Payload :</span>
                <pre className="text-[0.65rem] mt-1 p-2 bg-muted rounded overflow-auto max-h-48 scroll-thin">
                  {viewTarget.action ? JSON.stringify(parseAction(viewTarget.action), null, 2) : "—"}
                </pre>
              </div>
              {viewTarget.commentaire && (
                <div>
                  <span className="text-muted-foreground text-xs">Commentaire :</span>
                  <p className="mt-1 italic">{viewTarget.commentaire}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog rejet (commentaire obligatoire) */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter cette saisie ?</AlertDialogTitle>
            <AlertDialogDescription>
              {rejectTarget && (
                <>
                  La saisie {rejectTarget.entiteType} sera marquée comme rejetée.
                  <br />L'opération ne sera PAS appliquée en base.
                  <br />Un commentaire est obligatoire pour informer le saisiePar.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rejet-commentaire" className="text-xs">Motif du rejet</Label>
            <Textarea
              id="rejet-commentaire"
              placeholder="Ex : montant incohérent, animal déjà vendu, etc."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={validateOperation.isPending || !rejectComment.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {validateOperation.isPending ? "Traitement..." : "Confirmer le rejet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
