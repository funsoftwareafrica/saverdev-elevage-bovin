"use client";

// Vue Soins & calendrier vaccinal automatique (évolution 7).
//
// Affiche :
//   - KPIs : soins à venir, soins en retard, total cumulé, coût total
//   - Liste des soins à venir (calendrier) avec alerte visuelle si en retard
//   - Bouton "Marquer comme effectué" qui crée le Soin + génère automatiquement
//     la prochaine échéance
//   - Formulaire d'enregistrement d'un soin (manquant / rattrapage)
//
// Types prédéfinis : Vaccin FMD (6 mois), Vaccin PPB (12 mois),
// Vaccin charbon (12 mois), Antiparasitaire (3 mois), Vermifuge (3 mois),
// Traitement, Contrôle, Autre.

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSoins, useBovins, useCreateSoin, useDeleteSoin, useSoinsAVenir, useUpdateSoin } from "@/lib/api";
import { formatFCFA, formatDate } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarClock, Plus, Eye, Trash, AlertTriangle, CheckCircle2, Beef, Check } from "@/lib/icons";
import { ViewHeader, KpiCard } from "./_shared";
import { toast } from "sonner";
import type { Soin } from "@/lib/types";

const SOIN_TYPES = [
  "Vaccin FMD",
  "Vaccin PPB",
  "Vaccin charbon",
  "Antiparasitaire",
  "Vermifuge",
  "Traitement",
  "Contrôle",
  "Autre",
];

function isLate(prochainRappel: string | null): boolean {
  if (!prochainRappel) return false;
  return new Date(prochainRappel).getTime() < Date.now();
}

function isUpcoming(prochainRappel: string | null): boolean {
  if (!prochainRappel) return false;
  const t = new Date(prochainRappel).getTime();
  const now = Date.now();
  const septJours = 7 * 24 * 60 * 60 * 1000;
  return t >= now && t <= now + septJours;
}

export function SoinsView() {
  const role = useAppStore((s) => s.role);
  const readOnly = role === "SINERGI";
  const { data: soins, isLoading } = useSoins();
  const { data: bovins } = useBovins();
  const createSoin = useCreateSoin();
  const deleteSoin = useDeleteSoin();
  const updateSoin = useUpdateSoin();
  const { data: aVenirData } = useSoinsAVenir();

  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Soin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Soin | null>(null);
  const [filter, setFilter] = useState<"TOUS" | "RETARD" | "AVENIR" | "EFFECTUES">("TOUS");

  const allSoins = soins ?? [];
  const enRetard = allSoins.filter((s) => isLate(s.prochainRappel));
  const aVenir = allSoins.filter((s) => isUpcoming(s.prochainRappel));
  const totalCout = allSoins.reduce((s, x) => s + x.cout, 0);
  // Soins à venir dans les 30 prochains jours (depuis /api/soins/a-venir)
  const aVenir30 = aVenirData?.aVenir ?? [];
  const enRetardData = aVenirData?.enRetard ?? [];

  const filtered = (() => {
    switch (filter) {
      case "RETARD":
        return enRetard;
      case "AVENIR":
        return aVenir;
      case "EFFECTUES":
        return allSoins.filter((s) => !s.prochainRappel);
      default:
        return allSoins;
    }
  })();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createSoin.mutate(
      {
        bovinId: String(fd.get("bovinId")),
        type: String(fd.get("type") || "Contrôle"),
        libelle: String(fd.get("libelle") || ""),
        cout: Number(fd.get("cout") || 0),
        date: fd.get("date") ? String(fd.get("date")) : undefined,
        notes: fd.get("notes") ? String(fd.get("notes")) : undefined,
      },
      {
        onSuccess: (res: { prochainRappel?: string | null }) => {
          toast.success("Soin enregistré", {
            description: res?.prochainRappel
              ? `Prochaine échéance automatique : ${formatDate(res.prochainRappel)}`
              : "Aucun rappel programmé (type non récurrent)",
          });
          setOpen(false);
        },
        onError: () => toast.error("Échec de l'enregistrement"),
      }
    );
  };

  const handleMarquerEffectue = (s: Soin) => {
    // Crée un nouveau soin aujourd'hui (mêmes type/libellé) + rappel auto
    createSoin.mutate(
      {
        bovinId: s.bovinId,
        type: s.type,
        libelle: s.libelle,
        cout: s.cout,
        date: new Date().toISOString().slice(0, 10),
        notes: s.notes ? `${s.notes} (rappel effectué)` : "Rappel effectué",
      },
      {
        onSuccess: (res: { prochainRappel?: string | null }) => {
          // Marque le rappel du soin source comme traité (efface le prochainRappel)
          updateSoin.mutate({ id: s.id, prochainRappel: null });
          toast.success("Soin marqué comme effectué", {
            description: res?.prochainRappel
              ? `Nouvelle échéance : ${formatDate(res.prochainRappel)}`
              : "Aucun rappel futur programmé",
          });
        },
        onError: () => toast.error("Échec de l'enregistrement"),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteSoin.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Soin supprimé");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Échec de la suppression"),
    });
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Soins & calendrier vaccinal"
        description="Carnet de santé + échéances vaccinales automatiques (FMD 6 mois, PPB 12 mois, antiparasitaire 3 mois)."
        icon={CalendarClock}
        action={
          !readOnly && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary"><HugeiconsIcon icon={Plus} size={16} /> Enregistrer un soin</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer un soin</DialogTitle>
                  <DialogDescription className="text-xs">
                    La prochaine échéance est calculée automatiquement selon le type
                    (FMD/PPB/charbon 6-12 mois, antiparasitaire/vermifuge 3 mois).
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bovinId" className="text-xs">Animal</Label>
                    <Select name="bovinId" required>
                      <SelectTrigger><SelectValue placeholder="Sélectionnez un animal" /></SelectTrigger>
                      <SelectContent>
                        {(bovins ?? []).map((b) => (
                          <SelectItem key={b.id} value={b.id} className="text-xs">
                            {b.identifiant} — {b.race}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="type" className="text-xs">Type de soin</Label>
                    <Select name="type" defaultValue="Vaccin FMD">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOIN_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="libelle" className="text-xs">Libellé</Label>
                    <Input id="libelle" name="libelle" placeholder="Vaccin FMD 2e injection…" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="cout" className="text-xs">Coût (FCFA)</Label>
                      <Input id="cout" name="cout" type="number" placeholder="15000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="date" className="text-xs">Date du soin</Label>
                      <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs">Notes (optionnel)</Label>
                    <Textarea id="notes" name="notes" rows={2} placeholder="Réaction, dosage…" />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button type="submit" size="sm" className="bg-primary" disabled={createSoin.isPending}>
                      {createSoin.isPending ? "Enregistrement…" : "Enregistrer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Soins enregistrés" value={allSoins.length} icon={CalendarClock} variant="primary" hint="Cumul total" />
        <KpiCard label="En retard" value={enRetard.length} icon={AlertTriangle} variant={enRetard.length > 0 ? "danger" : "default"} hint="Échéance dépassée" />
        <KpiCard label="À venir (J-7)" value={aVenir.length} icon={CalendarClock} variant="warning" hint="Échéance sous 7 jours" />
        <KpiCard label="Coût total" value={formatFCFA(totalCout, false)} icon={Eye} hint="Cumul des soins" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm">Carnet de santé & échéances</CardTitle>
            <CardDescription className="text-xs">
              {filter === "TOUS" && "Tous les soins enregistrés"}
              {filter === "RETARD" && "Soins en retard (échéance dépassée)"}
              {filter === "AVENIR" && "Soins à venir dans les 7 prochains jours"}
              {filter === "EFFECTUES" && "Soins ponctuels (sans rappel)"}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {(["TOUS", "RETARD", "AVENIR", "EFFECTUES"] as const).map((k) => (
              <Button
                key={k}
                variant={filter === k ? "default" : "outline"}
                size="sm"
                className="h-7 text-[0.65rem]"
                onClick={() => setFilter(k)}
              >
                {k === "TOUS" ? "Tous" : k === "RETARD" ? "En retard" : k === "AVENIR" ? "À venir" : "Ponctuels"}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[55vh] overflow-auto scroll-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                <TableRow>
                  <TableHead>Animal</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                  <TableHead className="text-center">Prochain rappel</TableHead>
                  <TableHead className="w-[80px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    Aucun soin {filter === "RETARD" ? "en retard" : filter === "AVENIR" ? "à venir sous 7 jours" : "enregistré"}.
                  </TableCell></TableRow>
                ) : filtered.map((s) => {
                  const late = isLate(s.prochainRappel);
                  const upcoming = isUpcoming(s.prochainRappel);
                  return (
                    <TableRow key={s.id} className={late ? "bg-red-50/50" : upcoming ? "bg-amber-50/40" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={Beef} size={12} className="text-muted-foreground" />
                          <span className="text-xs font-medium">{s.bovinIdentifiant ?? "—"}</span>
                          {s.bovinEspece === "OVIN" && <Badge variant="outline" className="text-[0.55rem]">OVN</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(s.date)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[0.65rem]">{s.type}</Badge></TableCell>
                      <TableCell className="text-sm">{s.libelle}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatFCFA(s.cout, false)}</TableCell>
                      <TableCell className="text-center">
                        {s.prochainRappel ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`text-xs ${late ? "text-red-700 font-semibold" : upcoming ? "text-amber-700 font-semibold" : ""}`}>
                              {formatDate(s.prochainRappel)}
                            </span>
                            {late && (
                              <Badge variant="outline" className="text-[0.55rem] text-red-700 border-red-200 bg-red-50 gap-1">
                                <HugeiconsIcon icon={AlertTriangle} size={8} /> En retard
                              </Badge>
                            )}
                            {upcoming && (
                              <Badge variant="outline" className="text-[0.55rem] text-amber-700 border-amber-200 bg-amber-50">
                                J-7
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-[0.65rem] text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir les détails" onClick={() => setViewTarget(s)}>
                            <HugeiconsIcon icon={Eye} size={16} />
                          </Button>
                          {!readOnly && s.prochainRappel && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-700 hover:bg-emerald-50"
                              title="Marquer comme effectué (crée le soin aujourd'hui + prochaine échéance auto)"
                              onClick={() => handleMarquerEffectue(s)}
                              disabled={createSoin.isPending || updateSoin.isPending}
                            >
                              <HugeiconsIcon icon={Check} size={16} />
                            </Button>
                          )}
                          {!readOnly && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" title="Supprimer" onClick={() => setDeleteTarget(s)}>
                              <HugeiconsIcon icon={Trash} size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier des soins à venir (30 prochains jours) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <HugeiconsIcon icon={CalendarClock} size={16} className="text-primary" />
            Calendrier vaccinal — 30 prochains jours
          </CardTitle>
          <CardDescription className="text-xs">
            {aVenir30.length} soin(s) à venir · {enRetardData.length} en retard
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-72 overflow-auto scroll-thin">
            {aVenir30.length === 0 && enRetardData.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                <HugeiconsIcon icon={CheckCircle2} size={24} className="mx-auto mb-2 text-emerald-600" />
                Aucun rappel vaccinal programmé dans les 30 prochains jours.
              </div>
            ) : (
              <ul className="divide-y">
                {[...enRetardData, ...aVenir30].map((s) => (
                  <li key={s.id} className={`p-3 flex items-center gap-3 ${s.isLate ? "bg-red-50/60" : ""}`}>
                    <div className={`h-9 w-9 shrink-0 rounded-md flex flex-col items-center justify-center border ${s.isLate ? "bg-red-100 border-red-200 text-red-700" : "bg-amber-100 border-amber-200 text-amber-700"}`}>
                      <span className="text-[0.6rem] leading-none">{s.joursAvantEcheance === null ? "—" : Math.abs(s.joursAvantEcheance) === 0 ? "J" : s.isLate ? `J+${Math.abs(s.joursAvantEcheance)}` : `J-${s.joursAvantEcheance}`}</span>
                      <HugeiconsIcon icon={CalendarClock} size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {s.bovinIdentifiant} · {s.type} — {s.libelle}
                      </p>
                      <p className="text-[0.65rem] text-muted-foreground">
                        Échéance : {s.prochainRappel ? formatDate(s.prochainRappel) : "—"}
                        {s.isLate && " · en retard"}
                      </p>
                    </div>
                    {!readOnly && (
                      <Button
                        size="sm"
                        variant={s.isLate ? "default" : "outline"}
                        className="h-7 text-[0.65rem]"
                        onClick={() =>
                          handleMarquerEffectue({
                            id: s.id,
                            bovinId: s.bovinId,
                            date: s.date,
                            type: s.type,
                            libelle: s.libelle,
                            cout: s.cout,
                            prochainRappel: s.prochainRappel,
                            notes: s.notes,
                            bovinIdentifiant: s.bovinIdentifiant,
                            bovinEspece: s.bovinEspece,
                          } as Soin)
                        }
                        disabled={createSoin.isPending || updateSoin.isPending}
                      >
                        <HugeiconsIcon icon={Check} size={12} /> Effectué
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Note informative sur le calendrier vaccinal */}
      <Card className="border-primary/30 bg-primary/[0.03]">
        <CardContent className="p-4 flex items-start gap-3">
          <HugeiconsIcon icon={CheckCircle2} size={20} className="text-primary shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-foreground">Calendrier vaccinal automatique</p>
            <p className="text-muted-foreground">
              Lorsqu'un soin de type <strong>Vaccin FMD</strong>, <strong>Vaccin PPB</strong>,
              <strong> Vaccin charbon</strong>, <strong>Antiparasitaire</strong> ou <strong>Vermifuge</strong> est enregistré,
              la prochaine échéance est calculée automatiquement :
              FMD 6 mois · PPB 12 mois · charbon 12 mois · antiparasitaire 3 mois · vermifuge 3 mois.
            </p>
            <p className="text-muted-foreground">
              Les soins en retard sont affichés en <span className="text-red-700 font-semibold">rouge</span> et
              les soins à venir sous 7 jours en <span className="text-amber-700 font-semibold">ambre</span>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de visualisation */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détails du soin</DialogTitle>
            <DialogDescription className="text-xs">
              {viewTarget && formatDate(viewTarget.date)}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground text-xs">Animal :</span> <strong>{viewTarget.bovinIdentifiant ?? "—"}</strong>{viewTarget.bovinEspece === "OVIN" ? " (Ovin)" : " (Bovin)"}</div>
              <div><span className="text-muted-foreground text-xs">Type :</span> <Badge variant="outline" className="text-[0.65rem]">{viewTarget.type}</Badge></div>
              <div><span className="text-muted-foreground text-xs">Libellé :</span> <strong>{viewTarget.libelle}</strong></div>
              <div><span className="text-muted-foreground text-xs">Coût :</span> <strong className="text-primary">{formatFCFA(viewTarget.cout)}</strong></div>
              {viewTarget.prochainRappel && (
                <div>
                  <span className="text-muted-foreground text-xs">Prochaine échéance :</span>{" "}
                  <strong className={isLate(viewTarget.prochainRappel) ? "text-red-700" : isUpcoming(viewTarget.prochainRappel) ? "text-amber-700" : ""}>
                    {formatDate(viewTarget.prochainRappel)}
                  </strong>
                  {isLate(viewTarget.prochainRappel) && <span className="ml-2 text-xs text-red-700">(en retard)</span>}
                </div>
              )}
              {viewTarget.notes && (
                <div>
                  <span className="text-muted-foreground text-xs">Notes :</span>
                  <p className="mt-1 italic text-xs">{viewTarget.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce soin ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  Le soin <strong>{deleteTarget.type} — {deleteTarget.libelle}</strong> du{" "}
                  {formatDate(deleteTarget.date)} sera définitivement supprimé.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteSoin.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteSoin.isPending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
