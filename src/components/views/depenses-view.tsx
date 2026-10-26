"use client";

// Vue Dépenses — soins vétérinaires, transport, main-d'œuvre, autres charges.
// Boutons d'action : Voir (détails), Modifier, Supprimer.
// Inclut le budget prévisionnel par catégorie (évolution 5) avec barres de
// progression + alerte visuelle si dépassement.

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useDepenses, useCreateDepense, useUpdateDepense, useDeleteDepense, useBudgets, useUpdateBudget } from "@/lib/api";
import { formatFCFA, formatDate } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, Plus, Beef, Wallet, CreditCard, Eye, Pencil, Trash, AlertTriangle, Package, HardDrive, Calendar } from "@/lib/icons";
import { Stethoscope, Truck, Wrench, Users } from "lucide-react";
import { ViewHeader, KpiCard } from "./_shared";
import { toast } from "sonner";
import type { Depense, BudgetItem } from "@/lib/types";

const CATEGORIES = [
  { key: "Alimentation", icon: Package, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { key: "Salaires", icon: Wallet, color: "text-amber-700 bg-amber-50 border-amber-200" },
  { key: "Transport", icon: CreditCard, color: "text-sky-700 bg-sky-50 border-sky-200" },
  { key: "Matériel", icon: HardDrive, color: "text-violet-700 bg-violet-50 border-violet-200" },
  { key: "Gestion de l'eau", icon: Wallet, color: "text-blue-700 bg-blue-50 border-blue-200" },
  { key: "Santé", icon: AlertTriangle, color: "text-rose-700 bg-rose-50 border-rose-200" },
  { key: "Loyer", icon: HardDrive, color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  { key: "Communication", icon: Receipt, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  { key: "Événement", icon: Calendar, color: "text-orange-700 bg-orange-50 border-orange-200" },
  { key: "Immobilisation", icon: HardDrive, color: "text-stone-700 bg-stone-50 border-stone-200" },
  { key: "Autres", icon: Receipt, color: "text-muted-foreground bg-muted border-border" },
] as const;

export function DepensesView() {
  const role = useAppStore((s) => s.role);
  const readOnly = role === "SINERGI";
  const { data: depenses, isLoading } = useDepenses();
  const createDepense = useCreateDepense();
  const updateDepense = useUpdateDepense();
  const deleteDepense = useDeleteDepense();
  const { data: budgets } = useBudgets();
  const updateBudget = useUpdateBudget();
  const [filter, setFilter] = useState<string>("TOUS");
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Depense | null>(null);
  const [editTarget, setEditTarget] = useState<Depense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Depense | null>(null);
  const [budgetDialog, setBudgetDialog] = useState(false);
  const [budgetValues, setBudgetValues] = useState<Record<string, string>>({});

  const allDepenses = depenses ?? [];
  const budgetList: BudgetItem[] = budgets ?? [];
  const filtered = filter === "TOUS" ? allDepenses : allDepenses.filter((d) => d.categorie === filter);
  const total = allDepenses.reduce((s, d) => s + d.montant, 0);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createDepense.mutate(
      {
        categorie: String(fd.get("cat") || "Autres"),
        libelle: String(fd.get("lib") || ""),
        montant: Number(fd.get("montant") || 0),
        nbBovinsConcernes: Number(fd.get("nb") || 0),
        date: fd.get("date") ? String(fd.get("date")) : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Dépense enregistrée");
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
    updateDepense.mutate(
      {
        id: editTarget.id,
        date: String(fd.get("date")),
        categorie: String(fd.get("cat") || editTarget.categorie),
        libelle: String(fd.get("lib") || editTarget.libelle),
        montant: Number(fd.get("montant") ?? editTarget.montant),
        nbBovinsConcernes: Number(fd.get("nb") ?? editTarget.nbBovinsConcernes),
      },
      {
        onSuccess: () => {
          toast.success("Dépense modifiée", { description: "Imputation recalculée." });
          setEditTarget(null);
        },
        onError: () => toast.error("Échec de la modification"),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteDepense.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Dépense supprimée", { description: "Imputation annulée sur les bovins concernés." });
        setDeleteTarget(null);
      },
      onError: () => toast.error("Échec de la suppression"),
    });
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Dépenses d'exploitation"
        description="Soins vétérinaires, transport, main-d'œuvre et autres charges."
        icon={CreditCard}
        action={
          !readOnly && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary"><HugeiconsIcon icon={Plus} size={16} /> Nouvelle dépense</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer une dépense</DialogTitle>
                  <DialogDescription className="text-xs">Si des animaux sont concernés, le montant sera imputé à chacun.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cat" className="text-xs">Catégorie</Label>
                    <Select name="cat" defaultValue="Soins vétérinaires">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.key}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lib" className="text-xs">Libellé</Label>
                    <Input id="lib" name="lib" placeholder="Vaccination, transport lot..." required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="montant" className="text-xs">Montant (FCFA)</Label>
                      <Input id="montant" name="montant" type="number" placeholder="35000" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nb" className="text-xs">Nb animaux concernés</Label>
                      <Input id="nb" name="nb" type="number" placeholder="0 = charge globale" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="date" className="text-xs">Date</Label>
                    <Input id="date" name="date" type="date" required />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button type="submit" size="sm" className="bg-primary">Enregistrer</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {CATEGORIES.map((c) => {
          const sum = allDepenses.filter((d) => d.categorie === c.key).reduce((s, d) => s + d.montant, 0);
          const Icon = c.icon;
          return (
            <Card key={c.key} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`h-7 w-7 rounded-md flex items-center justify-center ${c.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">{c.key}</span>
                </div>
                <p className="text-lg font-bold tabular-nums">{formatFCFA(sum, false)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Budget prévisionnel par catégorie (évolution 5) */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <HugeiconsIcon icon={Wallet} size={16} className="text-primary" />
              Budget prévisionnel — mois en cours
            </CardTitle>
            <CardDescription className="text-xs">
              Dépenses réalisées vs budget prévu. Alerte rouge si dépassement.
            </CardDescription>
          </div>
          {!readOnly && (
            <Dialog
              open={budgetDialog}
              onOpenChange={(o) => {
                setBudgetDialog(o);
                if (o) {
                  const v: Record<string, string> = {};
                  budgetList.forEach((b) => { v[b.cle] = String(b.budget); });
                  setBudgetValues(v);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <HugeiconsIcon icon={Pencil} size={14} /> Modifier le budget
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Modifier les budgets</DialogTitle>
                  <DialogDescription className="text-xs">
                    Les montants sont en FCFA. Affectés au mois en cours.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {budgetList.map((b) => (
                    <div key={b.cle} className="space-y-1.5">
                      <Label htmlFor={`budget-${b.cle}`} className="text-xs">{b.categorie}</Label>
                      <Input
                        id={`budget-${b.cle}`}
                        type="number"
                        value={budgetValues[b.cle] ?? ""}
                        onChange={(e) => setBudgetValues({ ...budgetValues, [b.cle]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setBudgetDialog(false)}>Annuler</Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-primary"
                    disabled={updateBudget.isPending}
                    onClick={() => {
                      const updates = Object.entries(budgetValues);
                      const promises = updates.map(([cle, valeur]) =>
                        fetch("/api/budget", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ cle, valeur }),
                        })
                      );
                      Promise.all(promises)
                        .then(() => {
                          toast.success("Budgets mis à jour");
                          setBudgetDialog(false);
                          // Invalide le cache budgets via une re-fetch explicite
                          updateBudget.mutate({ cle: updates[0]?.[0] ?? "", valeur: updates[0]?.[1] ?? "" });
                        })
                        .catch(() => toast.error("Échec de la mise à jour"));
                    }}
                  >
                    {updateBudget.isPending ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {budgetList.length === 0 ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            budgetList.map((b) => {
              const pct = Math.min(100, Math.round(b.taux));
              const depasse = b.depasse;
              return (
                <div key={b.cle} className={`rounded-lg border p-3 ${depasse ? "border-red-300 bg-red-50/40" : "border-border bg-card"}`}>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{b.categorie}</span>
                      {depasse && (
                        <Badge variant="outline" className="text-[0.6rem] text-red-700 border-red-200 bg-red-50 gap-1">
                          <HugeiconsIcon icon={AlertTriangle} size={10} /> Dépassement
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs tabular-nums text-muted-foreground">
                      <span className={depasse ? "text-red-700 font-semibold" : ""}>
                        {formatFCFA(b.realise, false)}
                      </span>
                      {" / "}
                      {formatFCFA(b.budget, false)} FCFA
                    </div>
                  </div>
                  <Progress value={pct} className={depasse ? "[&>div]:bg-red-500 h-2" : "h-2"} />
                  <p className="text-[0.65rem] text-muted-foreground mt-1">
                    {Math.round(b.taux)}% du budget utilisé
                    {depasse && ` — dépassement de ${formatFCFA(b.realise - b.budget, false)} FCFA`}
                  </p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm">Historique des dépenses</CardTitle>
            <CardDescription className="text-xs">Total : {formatFCFA(total)}</CardDescription>
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="h-8">
              <TabsTrigger value="TOUS" className="text-xs">Tous ({allDepenses.length})</TabsTrigger>
              {CATEGORIES.map((c) => (
                <TabsTrigger key={c.key} value={c.key} className="text-xs hidden sm:inline-flex">{c.key}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[55vh] overflow-auto scroll-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Animaux</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-[130px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                ) : filtered.map((d) => {
                  const cat = CATEGORIES.find((c) => c.key === d.categorie);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="text-xs">{formatDate(d.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[0.65rem] ${cat?.color ?? ""}`}>{d.categorie}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{d.libelle}</TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        {d.nbBovinsConcernes > 0 ? (
                          <Badge variant="outline" className="text-[0.65rem] gap-1"><HugeiconsIcon icon={Beef} size={12} /> {d.nbBovinsConcernes}</Badge>
                        ) : <span className="text-[0.65rem] text-muted-foreground">Global</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums font-medium">{formatFCFA(d.montant, false)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir les détails" onClick={() => setViewTarget(d)}>
                            <HugeiconsIcon icon={Eye} size={16} />
                          </Button>
                          {!readOnly && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => setEditTarget(d)}>
                                <HugeiconsIcon icon={Pencil} size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Supprimer" onClick={() => setDeleteTarget(d)}>
                                <HugeiconsIcon icon={Trash} size={16} />
                              </Button>
                            </>
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

      {/* Dialog de visualisation */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la dépense</DialogTitle>
            <DialogDescription className="text-xs">
              {viewTarget && formatDate(viewTarget.date)}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground text-xs">Catégorie :</span> <br /><Badge variant="outline" className="text-[0.65rem]">{viewTarget.categorie}</Badge></div>
              <div><span className="text-muted-foreground text-xs">Libellé :</span> <br /><strong>{viewTarget.libelle}</strong></div>
              <div><span className="text-muted-foreground text-xs">Montant :</span> <br /><strong className="text-primary">{formatFCFA(viewTarget.montant)}</strong></div>
              <div>
                <span className="text-muted-foreground text-xs">Animaux concernés :</span>{" "}
                <strong>{viewTarget.nbBovinsConcernes > 0 ? viewTarget.nbBovinsConcernes : "Charge globale"}</strong>
                {viewTarget.nbBovinsConcernes > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (~{formatFCFA(viewTarget.montant / viewTarget.nbBovinsConcernes, false)}/tête)
                  </span>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de modification */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la dépense</DialogTitle>
            <DialogDescription className="text-xs">
              L'imputation aux bovins sera recalculée.
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={onEditSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat" className="text-xs">Catégorie</Label>
                <Select name="cat" defaultValue={editTarget.categorie}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.key}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lib" className="text-xs">Libellé</Label>
                <Input id="lib" name="lib" defaultValue={editTarget.libelle} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="montant" className="text-xs">Montant (FCFA)</Label>
                  <Input id="montant" name="montant" type="number" defaultValue={editTarget.montant} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nb" className="text-xs">Nb animaux concernés</Label>
                  <Input id="nb" name="nb" type="number" defaultValue={editTarget.nbBovinsConcernes} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={editTarget.date.slice(0, 10)} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditTarget(null)}>Annuler</Button>
                <Button type="submit" size="sm" className="bg-primary" disabled={updateDepense.isPending}>
                  {updateDepense.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette dépense ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  La dépense <strong>{deleteTarget.libelle}</strong> ({formatFCFA(deleteTarget.montant)}) sera supprimée.
                  <br />L'imputation aux {deleteTarget.nbBovinsConcernes > 0 ? deleteTarget.nbBovinsConcernes : 0} bovin(s) concerné(s) sera annulée.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteDepense.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteDepense.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
