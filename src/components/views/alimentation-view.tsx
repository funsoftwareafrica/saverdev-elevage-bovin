"use client";

// Vue Alimentation — achats d'aliments + imputation automatique par tête.
// Boutons d'action : Voir (détails), Modifier, Supprimer.

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAlimentations, useCreateAlimentation, useUpdateAlimentation, useDeleteAlimentation } from "@/lib/api";
import { formatFCFA, formatDate } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Salad, Plus, Receipt, PiggyBank, Beef, Package, Eye, Pencil, Trash } from "@/lib/icons";
import { ViewHeader, KpiCard } from "./_shared";
import { toast } from "sonner";
import type { Alimentation } from "@/lib/types";

export function AlimentationView() {
  const role = useAppStore((s) => s.role);
  const readOnly = role === "SINERGI";
  const [open, setOpen] = useState(false);
  const { data: alimentations, isLoading } = useAlimentations();
  const createAlim = useCreateAlimentation();
  const updateAlim = useUpdateAlimentation();
  const deleteAlim = useDeleteAlimentation();

  const [viewTarget, setViewTarget] = useState<Alimentation | null>(null);
  const [editTarget, setEditTarget] = useState<Alimentation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Alimentation | null>(null);

  const list = alimentations ?? [];
  const total = list.reduce((s, a) => s + a.coutTotal, 0);
  const nbSacs = list.reduce((s, a) => s + a.quantite, 0);
  const coutMoyenParTete = list.length ? list.reduce((s, a) => s + a.coutParTete, 0) / list.length : 0;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createAlim.mutate(
      {
        produit: String(fd.get("produit") || ""),
        quantite: Number(fd.get("quantite") || 0),
        unite: String(fd.get("unite") || "sac"),
        coutTotal: Number(fd.get("cout") || 0),
        nbBovinsConcernes: Number(fd.get("nb") || 0),
        commentaire: (fd.get("comment") as string) || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Alimentation enregistrée", { description: "Imputation par tête calculée automatiquement." });
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
    const dateStr = fd.get("date") as string;
    updateAlim.mutate(
      {
        id: editTarget.id,
        date: dateStr || undefined,
        produit: String(fd.get("produit") || editTarget.produit),
        quantite: Number(fd.get("quantite") ?? editTarget.quantite),
        unite: String(fd.get("unite") || editTarget.unite),
        coutTotal: Number(fd.get("cout") ?? editTarget.coutTotal),
        nbBovinsConcernes: Number(fd.get("nb") ?? editTarget.nbBovinsConcernes),
        commentaire: (fd.get("comment") as string) ?? editTarget.commentaire ?? null,
      },
      {
        onSuccess: () => {
          toast.success("Alimentation modifiée", { description: "Imputation par tête recalculée." });
          setEditTarget(null);
        },
        onError: () => toast.error("Échec de la modification"),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAlim.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Alimentation supprimée", { description: "Imputation par tête annulée sur les bovins." });
        setDeleteTarget(null);
      },
      onError: () => toast.error("Échec de la suppression"),
    });
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Alimentation"
        description="Saisie des aliments achetés et imputation automatique du coût par tête."
        icon={Package}
        action={
          !readOnly && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary">
                  <HugeiconsIcon icon={Plus} size={16} /> Nouvel achat
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer un achat d'aliment</DialogTitle>
                  <DialogDescription className="text-xs">
                    Le coût sera automatiquement réparti entre les animaux concernés.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="produit" className="text-xs">Produit</Label>
                      <Input id="produit" name="produit" placeholder="Son de blé, tourteau coton..." required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quantite" className="text-xs">Quantité</Label>
                      <Input id="quantite" name="quantite" type="number" placeholder="50" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="unite" className="text-xs">Unité</Label>
                      <Select name="unite" defaultValue="sac">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sac">sac</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="botte">botte</SelectItem>
                          <SelectItem value="quintal">quintal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cout" className="text-xs">Coût total (FCFA)</Label>
                      <Input id="cout" name="cout" type="number" placeholder="600000" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nb" className="text-xs">Nb animaux concernés</Label>
                      <Input id="nb" name="nb" type="number" placeholder="10" required />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="comment" className="text-xs">Commentaire (optionnel)</Label>
                      <Textarea id="comment" name="comment" rows={2} placeholder="BOV-001 à 010..." />
                    </div>
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

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Quantités achetées" value={`${nbSacs} sacs`} icon={Salad} variant="primary" />
        <KpiCard label="Coût total" value={formatFCFA(total)} icon={Receipt} />
        <KpiCard label="Coût moyen / tête" value={formatFCFA(coutMoyenParTete)} icon={PiggyBank} variant="warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Historique des achats</CardTitle>
          <CardDescription className="text-xs">Avec imputation automatique par tête</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-auto scroll-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Qté</TableHead>
                  <TableHead className="text-right">Coût total</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Animaux</TableHead>
                  <TableHead className="text-right">Par tête</TableHead>
                  <TableHead className="hidden lg:table-cell">Commentaire</TableHead>
                  <TableHead className="w-[130px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                ) : list.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-xs">{formatDate(a.date)}</TableCell>
                    <TableCell className="text-sm font-medium">{a.produit}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{a.quantite} {a.unite}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{formatFCFA(a.coutTotal, false)}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <Badge variant="outline" className="text-[0.65rem] gap-1">
                        <HugeiconsIcon icon={Beef} size={12} /> {a.nbBovinsConcernes}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums text-primary font-medium">
                      {formatFCFA(a.coutParTete, false)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{a.commentaire ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir les détails" onClick={() => setViewTarget(a)}>
                          <HugeiconsIcon icon={Eye} size={16} />
                        </Button>
                        {!readOnly && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => setEditTarget(a)}>
                              <HugeiconsIcon icon={Pencil} size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Supprimer" onClick={() => setDeleteTarget(a)}>
                              <HugeiconsIcon icon={Trash} size={16} />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de visualisation */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de l'achat</DialogTitle>
            <DialogDescription className="text-xs">
              {viewTarget && formatDate(viewTarget.date)}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground text-xs">Produit :</span> <br /><strong>{viewTarget.produit}</strong></div>
                <div><span className="text-muted-foreground text-xs">Quantité :</span> <br /><strong>{viewTarget.quantite} {viewTarget.unite}</strong></div>
                <div><span className="text-muted-foreground text-xs">Coût total :</span> <br /><strong className="text-primary">{formatFCFA(viewTarget.coutTotal)}</strong></div>
                <div><span className="text-muted-foreground text-xs">Animaux concernés :</span> <br /><strong>{viewTarget.nbBovinsConcernes}</strong></div>
                <div className="col-span-2"><span className="text-muted-foreground text-xs">Coût par tête :</span> <strong className="ml-2 text-primary">{formatFCFA(viewTarget.coutParTete)}</strong></div>
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">Commentaire :</span>
                  <p className="mt-1 text-foreground">{viewTarget.commentaire ?? "—"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de modification */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'achat d'aliment</DialogTitle>
            <DialogDescription className="text-xs">
              Le coût par tête et l'imputation aux bovins seront recalculés.
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={onEditSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="produit" className="text-xs">Produit</Label>
                  <Input id="produit" name="produit" defaultValue={editTarget.produit} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs">Date</Label>
                  <Input id="date" name="date" type="date" defaultValue={editTarget.date.slice(0, 10)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quantite" className="text-xs">Quantité</Label>
                  <Input id="quantite" name="quantite" type="number" defaultValue={editTarget.quantite} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unite" className="text-xs">Unité</Label>
                  <Select name="unite" defaultValue={editTarget.unite}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sac">sac</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="botte">botte</SelectItem>
                      <SelectItem value="quintal">quintal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cout" className="text-xs">Coût total (FCFA)</Label>
                  <Input id="cout" name="cout" type="number" defaultValue={editTarget.coutTotal} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nb" className="text-xs">Nb animaux concernés</Label>
                  <Input id="nb" name="nb" type="number" defaultValue={editTarget.nbBovinsConcernes} required />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="comment" className="text-xs">Commentaire</Label>
                  <Textarea id="comment" name="comment" rows={2} defaultValue={editTarget.commentaire ?? ""} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditTarget(null)}>Annuler</Button>
                <Button type="submit" size="sm" className="bg-primary" disabled={updateAlim.isPending}>
                  {updateAlim.isPending ? "Enregistrement..." : "Enregistrer"}
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
            <AlertDialogTitle>Supprimer cet achat d'aliment ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  L'achat <strong>{deleteTarget.produit}</strong> ({formatFCFA(deleteTarget.coutTotal)}) sera supprimé.
                  <br />L'imputation de <strong>{formatFCFA(deleteTarget.coutParTete)}/tête</strong> sera annulée sur les {deleteTarget.nbBovinsConcernes} bovins concernés.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteAlim.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteAlim.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
