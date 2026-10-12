"use client";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewHeader, KpiCard } from "./_shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePesees, useCreatePese, useUpdatePese, useDeletePese, useBovins } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Scale, Plus, Eye, Pencil, Trash } from "@/lib/icons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import type { Pese } from "@/lib/types";

export function PeseesView() {
  const role = useAppStore((s) => s.role);
  const readOnly = role === "SINERGI";
  const { data: pesees, isLoading } = usePesees();
  const { data: bovins } = useBovins();
  const createPese = useCreatePese();
  const updatePese = useUpdatePese();
  const deletePese = useDeletePese();
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Pese | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pese | null>(null);
  // Filtre par espèce — "ALL" = toutes espèces confondues
  const [especeFilter, setEspeceFilter] = useState<"ALL" | "BOVIN" | "OVIN">("ALL");
  // Espèce sélectionnée dans le formulaire de saisie
  const [formEspece, setFormEspece] = useState<"BOVIN" | "OVIN">("BOVIN");

  const list = pesees ?? [];
  const allActifs = (bovins ?? []).filter((b) => b.statut === "EN_ENGRAISSEMENT");
  // Liste filtrée par espèce pour le sélecteur du formulaire
  const actifs = formEspece === "ALL"
    ? allActifs
    : allActifs.filter((b) => b.espece === formEspece);
  // Liste filtrée pour le tableau (par especeFilter)
  const filteredList = especeFilter === "ALL"
    ? list
    : list.filter((p) => (p.espece ?? "BOVIN") === especeFilter);
  const poidsMoyen = filteredList.length ? filteredList.reduce((s, p) => s + p.poids, 0) / filteredList.length : 0;
  const distinctAnimaux = new Set(filteredList.map((p) => p.bovinId)).size;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const bovinId = String(fd.get("bovinId"));
    if (!bovinId) {
      toast.error("Veuillez sélectionner un animal à peser");
      return;
    }
    createPese.mutate(
      { bovinId, poids: Number(fd.get("poids")), methode: String(fd.get("methode") || "Manuelle") },
      { onSuccess: () => { toast.success("Pesée enregistrée"); setOpen(false); }, onError: () => toast.error("Échec") }
    );
  };

  const onEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTarget) return;
    const fd = new FormData(e.currentTarget);
    updatePese.mutate(
      {
        id: editTarget.id,
        date: String(fd.get("date")),
        poids: Number(fd.get("poids")),
        methode: String(fd.get("methode") || "Manuelle"),
      },
      {
        onSuccess: () => {
          toast.success("Pesée modifiée");
          setEditTarget(null);
        },
        onError: () => toast.error("Échec de la modification"),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deletePese.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Pesée supprimée");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Échec de la suppression"),
    });
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Pesées connectées"
        description="Suivi du poids par animal (bovins & ovins) — manuel ou balance connectée"
        icon={Scale}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary"><HugeiconsIcon icon={Plus} size={16} /> Nouvelle pesée</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Nouvelle pesée</DialogTitle></DialogHeader>
              <form onSubmit={onSubmit} className="space-y-3">
                {/* Sélecteur d'espèce dans le formulaire */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Espèce</Label>
                  <Select value={formEspece} onValueChange={(v) => setFormEspece(v as "BOVIN" | "OVIN")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BOVIN">Bovin (BOE)</SelectItem>
                      <SelectItem value="OVIN">Ovin (OVN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Sélecteur d'animal filtré par espèce */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Animal à peser</Label>
                  <select name="bovinId" required className="w-full h-9 rounded-md border px-3 text-sm">
                    <option value="">— Sélectionner un animal —</option>
                    {actifs.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.identifiant} — {b.race} ({b.espece === "OVIN" ? "Ovin" : "Bovin"})
                      </option>
                    ))}
                  </select>
                  {actifs.length === 0 && (
                    <p className="text-[0.65rem] text-amber-600">
                      Aucun {formEspece === "OVIN" ? "Ovin" : "Bovin"} disponible en engraissement.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Poids (kg)</Label>
                  <Input name="poids" type="number" placeholder="320" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Méthode</Label>
                  <select name="methode" className="w-full h-9 rounded-md border px-3 text-sm">
                    <option>Manuelle</option>
                    <option>Balance connectée</option>
                    <option>Estimée</option>
                  </select>
                </div>
                <DialogFooter>
                  <Button type="submit" size="sm" className="bg-primary">Enregistrer</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filtre par espèce + KPIs */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Filtrer par espèce :</span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={especeFilter === "ALL" ? "default" : "outline"}
            onClick={() => setEspeceFilter("ALL")}
            className="h-7 text-xs"
          >
            Toutes
          </Button>
          <Button
            size="sm"
            variant={especeFilter === "BOVIN" ? "default" : "outline"}
            onClick={() => setEspeceFilter("BOVIN")}
            className="h-7 text-xs"
          >
            🐄 Bovins
          </Button>
          <Button
            size="sm"
            variant={especeFilter === "OVIN" ? "default" : "outline"}
            onClick={() => setEspeceFilter("OVIN")}
            className="h-7 text-xs"
          >
            🐑 Ovins
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Pesées" value={filteredList.length} icon={Scale} variant="primary" />
        <KpiCard label="Poids moyen" value={`${Math.round(poidsMoyen)} kg`} icon={Scale} />
        <KpiCard label="Animaux pesés" value={distinctAnimaux} icon={Scale} variant="success" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <Skeleton className="h-48" />
          ) : filteredList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucune pesée {especeFilter !== "ALL" ? `d'${especeFilter === "OVIN" ? "ovins" : "bovins"}` : ""} enregistrée.
            </p>
          ) : (
            <div className="max-h-[55vh] overflow-auto scroll-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/80">
                  <tr className="text-left">
                    <th className="p-3">Date</th>
                    <th className="p-3">Animal</th>
                    <th className="p-3">Espèce</th>
                    <th className="p-3">Race</th>
                    <th className="p-3 text-right">Poids</th>
                    <th className="p-3">Méthode</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-3 text-xs">{formatDate(p.date)}</td>
                      <td className="p-3 font-mono font-semibold text-primary">{p.identifiant}</td>
                      <td className="p-3 text-xs">
                        <Badge variant="outline" className="text-[0.65rem] gap-1">
                          {p.espece === "OVIN" ? "🐑 Ovin" : "🐄 Bovin"}
                        </Badge>
                      </td>
                      <td className="p-3">{p.race}</td>
                      <td className="p-3 text-right tabular-nums font-bold text-primary">{p.poids} kg</td>
                      <td className="p-3"><Badge variant="outline" className="text-[0.65rem]">{p.methode}</Badge></td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 justify-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir les détails" onClick={() => setEditTarget(p)}>
                            <HugeiconsIcon icon={Eye} size={16} />
                          </Button>
                          {!readOnly && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => setEditTarget(p)}>
                                <HugeiconsIcon icon={Pencil} size={16} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" title="Supprimer" onClick={() => setDeleteTarget(p)}>
                                <HugeiconsIcon icon={Trash} size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de modification */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la pesée</DialogTitle>
            <DialogDescription className="text-xs">
              {editTarget && `Animal : ${editTarget.identifiant} (${editTarget.race})`}
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={onEditSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={editTarget.date.slice(0, 10)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="poids" className="text-xs">Poids (kg)</Label>
                <Input id="poids" name="poids" type="number" defaultValue={editTarget.poids} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="methode" className="text-xs">Méthode</Label>
                <Select name="methode" defaultValue={editTarget.methode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manuelle">Manuelle</SelectItem>
                    <SelectItem value="Balance connectée">Balance connectée</SelectItem>
                    <SelectItem value="Estimée">Estimée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditTarget(null)}>Annuler</Button>
                <Button type="submit" size="sm" className="bg-primary" disabled={updatePese.isPending}>
                  {updatePese.isPending ? "Enregistrement..." : "Enregistrer"}
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
            <AlertDialogTitle>Supprimer cette pesée ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  La pesée de <strong>{deleteTarget.identifiant}</strong> ({deleteTarget.poids} kg) sera supprimée définitivement.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletePese.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletePese.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
