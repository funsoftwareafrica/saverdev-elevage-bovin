"use client";

// Vue Ventes & sorties — enregistrement des ventes + calcul automatique de la marge.

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useVentes, useBovins, useCreateVente, useDeleteVente } from "@/lib/api";
import { computeBovinMarge } from "@/lib/calculations";
import { formatFCFA, formatDate } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Plus, TrendingUp, TrendingDown, Calendar, User, Eye, Trash } from "@/lib/icons";
// Note: ShoppingCart reste pour les KPI cards (ventes/CA), TrendingUp pour l'en-tête (aligné sur cattly.io)
import { ViewHeader, KpiCard } from "./_shared";
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
import { toast } from "sonner";
import type { Bovin } from "@/lib/types";

export function VentesView() {
  const role = useAppStore((s) => s.role);
  const readOnly = role === "SINERGI";
  const [open, setOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<Bovin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bovin | null>(null);
  const { data: vendus, isLoading } = useVentes();
  const { data: allBovins } = useBovins();
  const createVente = useCreateVente();
  const deleteVente = useDeleteVente();

  const vendusList = vendus ?? [];
  const actifs = (allBovins ?? []).filter((b) => b.statut === "EN_ENGRAISSEMENT");
  const ca = vendusList.reduce((s, b) => s + b.prixVente, 0);
  const margeTotale = vendusList.reduce((s, b) => {
    const { marge } = computeBovinMarge(b);
    return s + (marge ?? 0);
  }, 0);
  const margeMoyenne = vendusList.length ? margeTotale / vendusList.length : 0;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createVente.mutate(
      {
        bovinId: String(fd.get("bovin") || ""),
        prixVente: Number(fd.get("prix") || 0),
        dateVente: fd.get("date") ? String(fd.get("date")) : undefined,
        client: (fd.get("client") as string) || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Vente enregistrée", { description: "Marge calculée automatiquement." });
          setOpen(false);
        },
        onError: () => toast.error("Échec de l'enregistrement"),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteVente.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Vente annulée", { description: `${deleteTarget.identifiant} remis en engraissement.` });
        setDeleteTarget(null);
      },
      onError: () => toast.error("Échec de l'annulation"),
    });
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Ventes & sorties"
        description="Enregistrement des ventes — marge calculée automatiquement (prix de vente – coût de revient)."
        icon={TrendingUp}
        action={
          !readOnly && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary"><HugeiconsIcon icon={Plus} size={16} /> Enregistrer une vente</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer une vente</DialogTitle>
                  <DialogDescription className="text-xs">Le coût de revient sera figé et la marge calculée.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bovin" className="text-xs">Animal à vendre (BOE/OVN)</Label>
                  <Select name="bovin">
                      <SelectTrigger><SelectValue placeholder="Sélectionner un animal actif" /></SelectTrigger>
                      <SelectContent>
                        {actifs.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.identifiant} {b.espece === "OVIN" ? "🐑" : "🐄"} — {b.race} ({formatFCFA(b.prixAchat + b.coutsEngraissement, false)} revient)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="prix" className="text-xs">Prix de vente (FCFA)</Label>
                      <Input id="prix" name="prix" type="number" placeholder="550000" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="date" className="text-xs">Date de vente</Label>
                      <Input id="date" name="date" type="date" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="client" className="text-xs">Client</Label>
                    <Input id="client" name="client" placeholder="Boucherie, restaurant, marché..." />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button type="submit" size="sm" className="bg-primary">Enregistrer la vente</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Animaux vendus" value={vendusList.length} icon={ShoppingCart} variant="primary" />
        <KpiCard label="Chiffre d'affaires" value={formatFCFA(ca)} icon={ShoppingCart} variant="success" />
        <KpiCard
          label="Marge totale"
          value={formatFCFA(margeTotale)}
          icon={margeTotale >= 0 ? TrendingUp : TrendingDown}
          variant={margeTotale >= 0 ? "success" : "danger"}
          hint={`Marge moyenne : ${formatFCFA(margeMoyenne, false)}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Historique des ventes</CardTitle>
          <CardDescription className="text-xs">Marges par bovin vendu</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[55vh] overflow-auto scroll-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                <TableRow>
                  <TableHead>Animal</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Client</TableHead>
                  <TableHead className="text-right">Prix vente</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Coût revient</TableHead>
                  <TableHead className="text-right">Marge</TableHead>
                  <TableHead className="w-[100px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                  ))
                ) : vendusList.map((b) => {
                  const { coutRevient, marge } = computeBovinMarge(b);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono font-semibold text-primary text-sm">
                        {b.identifiant} <span className="ml-1 text-xs font-normal text-muted-foreground">{b.espece === "OVIN" ? "🐑 Ovin" : "🐄 Bovin"}</span>
                      </TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <HugeiconsIcon icon={Calendar} size={12} /> {formatDate(b.dateVente)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{b.clientVente ?? "—"}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatFCFA(b.prixVente, false)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums hidden lg:table-cell text-muted-foreground">{formatFCFA(coutRevient, false)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums font-medium">
                        {marge !== null && marge >= 0 ? (
                          <span className="text-emerald-700 flex items-center justify-end gap-0.5"><HugeiconsIcon icon={TrendingUp} size={12} />{formatFCFA(marge, false)}</span>
                        ) : (
                          <span className="text-red-700 flex items-center justify-end gap-0.5"><HugeiconsIcon icon={TrendingDown} size={12} />{formatFCFA(marge ?? 0, false)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir les détails" onClick={() => setViewTarget(b)}>
                            <HugeiconsIcon icon={Eye} size={16} />
                          </Button>
                          {!readOnly && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Annuler la vente" onClick={() => setDeleteTarget(b)}>
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

      {/* Dialog de visualisation */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la vente</DialogTitle>
            <DialogDescription className="text-xs">
              {viewTarget && `Vendu le ${formatDate(viewTarget.dateVente ?? viewTarget.dateAchat)}`}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (() => {
            const { coutRevient, marge } = computeBovinMarge(viewTarget);
            return (
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground text-xs">Animal :</span> <br /><strong className="font-mono text-primary">{viewTarget.identifiant}</strong> <span className="text-xs text-muted-foreground">{viewTarget.espece === "OVIN" ? "🐑 Ovin" : "🐄 Bovin"}</span></div>
                <div><span className="text-muted-foreground text-xs">Race :</span> <br /><strong>{viewTarget.race}</strong></div>
                <div><span className="text-muted-foreground text-xs">Client :</span> <br /><strong>{viewTarget.clientVente ?? "—"}</strong></div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-muted-foreground text-xs">Prix vente :</span>
                    <p className="font-bold text-primary tabular-nums">{formatFCFA(viewTarget.prixVente)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Coût revient :</span>
                    <p className="font-bold tabular-nums text-muted-foreground">{formatFCFA(coutRevient)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground text-xs">Marge :</span>
                    <p className={`font-bold tabular-nums ${marge !== null && marge >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {formatFCFA(marge ?? 0)} ({marge !== null && viewTarget.prixVente > 0 ? Math.round((marge / viewTarget.prixVente) * 100) : 0}%)
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Confirmation d'annulation de vente */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette vente ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  La vente de <strong>{deleteTarget.identifiant}</strong> ({formatFCFA(deleteTarget.prixVente)}) sera annulée.
                  <br />Le bovin sera remis en <strong>engraissement</strong> (statut, prix de vente et client effacés).
                  <br />Les coûts d'engraissement accumulés sont conservés.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteVente.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteVente.isPending ? "Annulation..." : "Confirmer l'annulation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
