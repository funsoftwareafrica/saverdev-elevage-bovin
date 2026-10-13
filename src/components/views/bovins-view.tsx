"use client";

// Vue Cheptel (Bovins + Ovins) — liste des animaux avec filtres par espèce + statut + accès à la fiche détaillée.
// Bouton "Nouvel achat" avec Dialog form fonctionnel (sélecteur Espèce + race par défaut dynamique).

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useBovins, useCreateBovin, useUpdateBovin, useDeleteBovin } from "@/lib/api";
import { computeBovinMarge } from "@/lib/calculations";
import { formatFCFA, formatDate, statutBovinColor, joursEntre } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Beef, Search, Eye, Plus, Pencil, Trash, TrendingUp, TrendingDown, Database, Download } from "@/lib/icons";
import { ViewHeader, EmptyState, KpiCard, especeBadgeClass, especeLabel } from "./_shared";
import { exportCSV } from "@/lib/export";
import type { Bovin, StatutBovin } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { toast } from "sonner";

// Race par défaut selon l'espèce (utilisé dans le formulaire de nouvel achat).
const RACE_PAR_DEFAUT: Record<"BOVIN" | "OVIN", string> = {
  BOVIN: "Zébu",
  OVIN: "Mouton Sokoto",
};

export function BovinsView() {
  const openBovin = useAppStore((s) => s.openBovin);

  const role = useAppStore((s) => s.role);
  const readOnly = role === "SINERGI";
  const { data: bovins, isLoading } = useBovins();
  const createBovin = useCreateBovin();
  const updateBovin = useUpdateBovin();
  const deleteBovin = useDeleteBovin();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"TOUS" | StatutBovin>("TOUS");
  const [especeFilter, setEspeceFilter] = useState<"ALL" | "BOVIN" | "OVIN">("ALL");
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Bovin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bovin | null>(null);

  // --- État du formulaire de nouvel achat (espèce + race dynamique) ---
  const [formEspece, setFormEspece] = useState<"BOVIN" | "OVIN">("BOVIN");
  const [formRace, setFormRace] = useState<string>(RACE_PAR_DEFAUT.BOVIN);

  // Handler espèce : change l'espèce et adapte la race par défaut.
  // On ne réécrit la race que si elle valait l'ancienne valeur par défaut,
  // pour ne pas écraser une saisie personnalisée de l'utilisateur.
  const handleEspeceChange = (next: "BOVIN" | "OVIN") => {
    setFormEspece((prevEspece) => {
      // Si la race actuelle était la valeur par défaut de l'ancienne espèce,
      // on la remplace par la valeur par défaut de la nouvelle espèce.
      setFormRace((prevRace) => {
        const defautPrecedente = RACE_PAR_DEFAUT[prevEspece];
        if (prevRace === defautPrecedente || prevRace === "") {
          return RACE_PAR_DEFAUT[next];
        }
        return prevRace;
      });
      return next;
    });
  };

  // Réinitialisation du formulaire quand on ferme le Dialog nouvel achat.
  const resetForm = () => {
    setFormEspece("BOVIN");
    setFormRace(RACE_PAR_DEFAUT.BOVIN);
  };
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    setOpen(nextOpen);
  };

  const allBovins = bovins ?? [];
  const filtered = useMemo(() => {
    return allBovins.filter((b) => {
      if (filter !== "TOUS" && b.statut !== filter) return false;
      if (especeFilter !== "ALL" && b.espece !== especeFilter) return false;
      if (search && !b.identifiant.toLowerCase().includes(search.toLowerCase()) && !b.race.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, filter, especeFilter, allBovins]);

  const actifs = allBovins.filter((b) => b.statut === "EN_ENGRAISSEMENT");
  const actifsBovins = actifs.filter((b) => b.espece !== "OVIN");
  const actifsOvins = actifs.filter((b) => b.espece === "OVIN");
  const vendus = allBovins.filter((b) => b.statut === "VENDU");
  const valeurCheptel = actifs.reduce((s, b) => s + b.prixAchat + b.coutsEngraissement, 0);

  const handleExport = () => {
    exportCSV(
      filtered.map((b) => {
        const { coutRevient, marge } = computeBovinMarge(b);
        return { identifiant: b.identifiant, espece: b.espece, race: b.race, sexe: b.sexe, dateAchat: formatDate(b.dateAchat), prixAchat: b.prixAchat, poidsAchat: b.poidsAchat, statut: b.statut, coutsEngraissement: b.coutsEngraissement, autresCouts: b.autresCouts, prixVente: b.prixVente, coutRevient, marge: marge ?? "" };
      }),
      [
        { key: "identifiant", label: "Identifiant" },
        { key: "espece", label: "Espèce" },
        { key: "race", label: "Race" },
        { key: "sexe", label: "Sexe" },
        { key: "dateAchat", label: "Date achat" },
        { key: "prixAchat", label: "Prix achat (FCFA)" },
        { key: "poidsAchat", label: "Poids achat (kg)" },
        { key: "statut", label: "Statut" },
        { key: "coutsEngraissement", label: "Coûts engrais." },
        { key: "autresCouts", label: "Autres coûts" },
        { key: "prixVente", label: "Prix vente" },
        { key: "coutRevient", label: "Coût revient" },
        { key: "marge", label: "Marge" },
      ],
      "animaux.csv"
    );
    toast.success("Export CSV", { description: `${filtered.length} animal(s) exporté(s)` });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createBovin.mutate(
      {
        espece: formEspece,
        race: formRace || RACE_PAR_DEFAUT[formEspece],
        sexe: String(fd.get("sexe") || "Mâle"),
        dateAchat: String(fd.get("dateAchat") || new Date().toISOString().slice(0, 10)),
        prixAchat: Number(fd.get("prixAchat") || 0),
        poidsAchat: Number(fd.get("poidsAchat") || 0),
      },
      {
        onSuccess: () => {
          toast.success("Animal enregistré", { description: `Nouvel ${formEspece === "OVIN" ? "ovin" : "bovin"} ajouté au cheptel` });
          setOpen(false);
        },
        onError: () => toast.error("Échec de l'enregistrement"),
      }
    );
  };

  const onEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    const fd = new FormData(e.currentTarget);
    updateBovin.mutate(
      {
        id: editTarget.id,
        race: String(fd.get("race") || editTarget.race),
        sexe: String(fd.get("sexe") || editTarget.sexe),
        espece: String(fd.get("espece") || editTarget.espece),
        poidsAchat: Number(fd.get("poidsAchat") ?? editTarget.poidsAchat),
      },
      {
        onSuccess: () => {
          toast.success("Animal modifié", { description: editTarget.identifiant });
          setEditTarget(null);
        },
        onError: () => toast.error("Échec de la modification"),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteBovin.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Animal supprimé", { description: deleteTarget.identifiant });
        setDeleteTarget(null);
      },
      onError: () => toast.error("Échec de la suppression"),
    });
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Cheptel (Bovins + Ovins)"
        description="Liste des animaux (bovins BOE + ovins OVN), statuts et marges. Cliquez sur une ligne pour ouvrir la fiche détaillée."
        icon={Database}
        action={
          !readOnly && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <HugeiconsIcon icon={Download} size={16} /> Export CSV
              </Button>
              <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary">
                    <HugeiconsIcon icon={Plus} size={16} /> Nouvel achat
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Enregistrer un nouvel achat</DialogTitle>
                    <DialogDescription className="text-xs">
                      Un identifiant BOE-XXX (bovin) ou OVN-XXX (ovin) sera généré selon l'espèce.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={onSubmit} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="espece" className="text-xs">Espèce</Label>
                      <Select
                        name="espece"
                        value={formEspece}
                        onValueChange={(v) => handleEspeceChange(v as "BOVIN" | "OVIN")}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BOVIN">Bovin (BOE)</SelectItem>
                          <SelectItem value="OVIN">Ovin (OVN)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="race" className="text-xs">Race</Label>
                      <Input
                        id="race"
                        name="race"
                        placeholder={formEspece === "OVIN" ? "Mouton Sokoto" : "Zébu Gobra"}
                        value={formRace}
                        onChange={(e) => setFormRace(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="sexe" className="text-xs">Sexe</Label>
                        <Select name="sexe" defaultValue="Mâle">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mâle">Mâle</SelectItem>
                            <SelectItem value="Femelle">Femelle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="dateAchat" className="text-xs">Date d'achat</Label>
                        <Input id="dateAchat" name="dateAchat" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="prixAchat" className="text-xs">Prix d'achat (FCFA)</Label>
                        <Input id="prixAchat" name="prixAchat" type="number" placeholder={formEspece === "OVIN" ? "50000" : "450000"} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="poidsAchat" className="text-xs">Poids d'achat (kg)</Label>
                        <Input id="poidsAchat" name="poidsAchat" type="number" placeholder={formEspece === "OVIN" ? "20" : "280"} required />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
                      <Button type="submit" size="sm" className="bg-primary" disabled={createBovin.isPending}>
                        {createBovin.isPending ? "Enregistrement..." : "Enregistrer l'achat"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )
        }
      />

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <KpiCard label="Animaux actifs" value={actifs.length} icon={Beef} variant="primary" />
        <KpiCard label="🐄 Bovins actifs" value={actifsBovins.length} icon={Beef} />
        <KpiCard label="🐑 Ovins actifs" value={actifsOvins.length} icon={Beef} variant="warning" />
        <KpiCard label="Animaux vendus" value={vendus.length} icon={TrendingUp} variant="success" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 min-w-[180px]">
              <HugeiconsIcon icon={Search} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher (BOE-001 / OVN-001, Zébu...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Tabs value={especeFilter} onValueChange={(v) => setEspeceFilter(v as typeof especeFilter)}>
                <TabsList className="h-9">
                  <TabsTrigger value="ALL" className="text-xs">Toutes ({allBovins.length})</TabsTrigger>
                  <TabsTrigger value="BOVIN" className="text-xs">🐄 Bovins ({actifsBovins.length + vendus.filter((b) => b.espece !== "OVIN").length})</TabsTrigger>
                  <TabsTrigger value="OVIN" className="text-xs">🐑 Ovins ({actifsOvins.length + vendus.filter((b) => b.espece === "OVIN").length})</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList className="h-9">
                  <TabsTrigger value="TOUS" className="text-xs">Tous ({allBovins.length})</TabsTrigger>
                  <TabsTrigger value="EN_ENGRAISSEMENT" className="text-xs">Actifs ({actifs.length})</TabsTrigger>
                  <TabsTrigger value="VENDU" className="text-xs">Vendus ({vendus.length})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
          <div className="rounded-md border overflow-hidden">
            <div className="max-h-[60vh] overflow-auto scroll-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur z-10">
                  <TableRow>
                    <TableHead className="w-[110px]">Identifiant</TableHead>
                    <TableHead className="w-[110px]">Espèce</TableHead>
                    <TableHead>Race</TableHead>
                    <TableHead className="hidden sm:table-cell">Achat</TableHead>
                    <TableHead className="text-right">Prix achat</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Coûts engrais.</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Coût revient</TableHead>
                    <TableHead className="text-right">Marge</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="w-[130px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <EmptyState icon={Beef} title="Aucun animal trouvé" description="Modifiez votre recherche ou filtre." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((b) => {
                      const { coutRevient, marge } = computeBovinMarge(b);
                      const { emoji, label } = especeLabel(b.espece);
                      return (
                        <TableRow
                          key={b.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => openBovin(b.id)}
                        >
                          <TableCell className="font-mono font-semibold text-primary">{b.identifiant}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[0.65rem] ${especeBadgeClass(b.espece)}`}>
                              {emoji} {label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{b.race}</TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                            <div>{formatDate(b.dateAchat)}</div>
                            <div className="text-[0.65rem] opacity-70">{joursEntre(b.dateAchat, b.dateVente)} j</div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">{formatFCFA(b.prixAchat, false)}</TableCell>
                          <TableCell className="text-right tabular-nums text-sm hidden md:table-cell">{formatFCFA(b.coutsEngraissement + b.autresCouts, false)}</TableCell>
                          <TableCell className="text-right tabular-nums text-sm hidden lg:table-cell">{formatFCFA(coutRevient, false)}</TableCell>
                          <TableCell className="text-right tabular-nums text-sm font-medium">
                            {marge === null ? (
                              <span className="text-muted-foreground">—</span>
                            ) : marge >= 0 ? (
                              <span className="text-emerald-700 flex items-center justify-end gap-0.5">
                                <HugeiconsIcon icon={TrendingUp} size={12} />{formatFCFA(marge, false)}
                              </span>
                            ) : (
                              <span className="text-red-700 flex items-center justify-end gap-0.5">
                                <HugeiconsIcon icon={TrendingDown} size={12} />{formatFCFA(marge, false)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[0.65rem] ${statutBovinColor(b.statut)}`}>
                              {b.statut === "EN_ENGRAISSEMENT" ? "En engrais." : b.statut === "VENDU" ? "Vendu" : "Mort"}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir la fiche" onClick={() => openBovin(b.id)}>
                                <HugeiconsIcon icon={Eye} size={16} />
                              </Button>
                              {!readOnly && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => setEditTarget(b)}>
                                    <HugeiconsIcon icon={Pencil} size={16} />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Supprimer" onClick={() => setDeleteTarget(b)}>
                                    <HugeiconsIcon icon={Trash} size={16} />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de modification */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'animal</DialogTitle>
            <DialogDescription className="text-xs">
              {editTarget?.identifiant} — l'identifiant et les cumuls comptables ne sont pas modifiables.
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={onEditSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="race" className="text-xs">Race</Label>
                  <Input id="race" name="race" defaultValue={editTarget.race} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sexe" className="text-xs">Sexe</Label>
                  <Select name="sexe" defaultValue={editTarget.sexe}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mâle">Mâle</SelectItem>
                      <SelectItem value="Femelle">Femelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="espece" className="text-xs">Espèce</Label>
                  <Select name="espece" defaultValue={editTarget.espece}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BOVIN">Bovin (BOE)</SelectItem>
                      <SelectItem value="OVIN">Ovin (OVN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="poidsAchat" className="text-xs">Poids d'achat (kg)</Label>
                  <Input id="poidsAchat" name="poidsAchat" type="number" defaultValue={editTarget.poidsAchat} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditTarget(null)}>Annuler</Button>
                <Button type="submit" size="sm" className="bg-primary" disabled={updateBovin.isPending}>
                  {updateBovin.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet animal ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  Cet animal <strong>{deleteTarget.identifiant}</strong> ({deleteTarget.race}) sera supprimé définitivement.
                  <br />Cette action est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteBovin.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteBovin.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
