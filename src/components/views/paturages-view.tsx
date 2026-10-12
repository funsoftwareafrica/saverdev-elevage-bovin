"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  usePaturages,
  useUpdatePaturage,
  useDeletePaturage,
} from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { Map, MapPin, Pencil, Trash } from "@/lib/icons";
import { ViewHeader, KpiCard } from "./_shared";
import { toast } from "sonner";
import type { Paturage } from "@/lib/types";

export function PaturagesView() {
  const role = useAppStore((s) => s.role);
  const readOnly = role === "SINERGI";
  const { data: paturages, isLoading } = usePaturages();
  const updatePaturage = useUpdatePaturage();
  const deletePaturage = useDeletePaturage();
  const [editTarget, setEditTarget] = useState<Paturage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Paturage | null>(null);

  const list = paturages ?? [];
  const surfaceTotale = list.reduce((s, p) => s + p.surface, 0);
  const capaciteTotal = list.reduce((s, p) => s + p.capacite, 0);

  const onEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    const fd = new FormData(e.currentTarget);
    updatePaturage.mutate(
      {
        id: editTarget.id,
        nom: String(fd.get("nom") || editTarget.nom),
        surface: Number(fd.get("surface") ?? editTarget.surface),
        coordonnees: (fd.get("coordonnees") as string) || null,
        capacite: Number(fd.get("capacite") ?? editTarget.capacite),
      },
      {
        onSuccess: () => {
          toast.success("Pâturage modifié", { description: editTarget.nom });
          setEditTarget(null);
        },
        onError: () => toast.error("Échec de la modification"),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deletePaturage.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Pâturage supprimé", { description: deleteTarget.nom });
        setDeleteTarget(null);
      },
      onError: () => toast.error("Échec de la suppression"),
    });
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Pâturages"
        description="Géolocalisation et gestion des parcelles"
        icon={Map}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Parcelles" value={list.length} icon={Map} variant="primary" />
        <KpiCard label="Surface totale" value={`${surfaceTotale.toFixed(1)} ha`} icon={Map} />
        <KpiCard label="Capacité totale" value={`${capaciteTotal} bovins`} icon={Map} variant="success" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Carte des parcelles</CardTitle>
          <CardDescription className="text-xs">Aperçu spatial des pâturages enregistrés</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? <Skeleton className="h-48" /> : list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Aucun pâturage enregistré.</p> : (
            <div className="relative h-[300px] bg-muted/30 rounded-xl border border-border overflow-hidden">
              {list.map((p, i) => (
                <div key={p.id} className="absolute border-2 border-primary/30 bg-primary/10 rounded-lg p-3 cursor-pointer hover:border-primary/60 hover:shadow-md transition-all"
                  style={{ top: `${(i % 3) * 30 + 10}%`, left: `${(i * 25 + 5) % 70}%`, width: `${20 + p.surface * 3}%`, minHeight: 80 }}>
                  <div className="flex items-center gap-1.5"><HugeiconsIcon icon={MapPin} size={12} className="shrink-0 text-primary" /><p className="text-xs font-semibold text-foreground">{p.nom}</p></div>
                  <p className="text-[0.65rem] text-muted-foreground mt-1">{p.surface} ha · {p.capacite} bovins</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {list.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Détail des parcelles</CardTitle>
            <CardDescription className="text-xs">Modifier ou supprimer un pâturage</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[55vh] overflow-auto scroll-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80">
                  <tr className="text-left">
                    <th className="p-3">Parcelle</th>
                    <th className="p-3 text-right">Surface (ha)</th>
                    <th className="p-3 text-right">Capacité</th>
                    <th className="p-3 hidden sm:table-cell">Localisation</th>
                    <th className="p-3 text-center w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon icon={MapPin} size={12} className="shrink-0 text-primary" />
                          <span className="font-medium">{p.nom}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right tabular-nums">{p.surface}</td>
                      <td className="p-3 text-right tabular-nums">{p.capacite} bovins</td>
                      <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell">{p.coordonnees ?? "—"}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 justify-center">
                          {!readOnly ? (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => setEditTarget(p)}>
                                <HugeiconsIcon icon={Pencil} size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Supprimer" onClick={() => setDeleteTarget(p)}>
                                <HugeiconsIcon icon={Trash} size={16} />
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Lecture seule</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de modification */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le pâturage</DialogTitle>
            <DialogDescription className="text-xs">
              Les caractéristiques de la parcelle seront mises à jour.
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={onEditSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nom" className="text-xs">Nom de la parcelle</Label>
                <Input id="nom" name="nom" defaultValue={editTarget.nom} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="surface" className="text-xs">Surface (ha)</Label>
                  <Input id="surface" name="surface" type="number" step="0.1" defaultValue={editTarget.surface} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="capacite" className="text-xs">Capacité (bovins)</Label>
                  <Input id="capacite" name="capacite" type="number" defaultValue={editTarget.capacite} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="coordonnees" className="text-xs">Localisation (GPS ou adresse)</Label>
                <Input id="coordonnees" name="coordonnees" defaultValue={editTarget.coordonnees ?? ""} placeholder="13.51, 2.11 ou Niamey..." />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditTarget(null)}>Annuler</Button>
                <Button type="submit" size="sm" className="bg-primary" disabled={updatePaturage.isPending}>
                  {updatePaturage.isPending ? "Enregistrement..." : "Enregistrer"}
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
            <AlertDialogTitle>Supprimer ce pâturage ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  La parcelle <strong>{deleteTarget.nom}</strong> ({deleteTarget.surface} ha) sera supprimée définitivement.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePaturage.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletePaturage.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
