"use client";

// Vue Alimentation — achats d'aliments + imputation automatique par tête.

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAlimentations, useCreateAlimentation } from "@/lib/api";
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
import { Salad, Plus, Receipt, PiggyBank, Beef, Package } from "@/lib/icons";
import { ViewHeader, KpiCard } from "./_shared";
import { toast } from "sonner";

export function AlimentationView() {
  const role = useAppStore((s) => s.role);
  const readOnly = role === "SINERGI";
  const [open, setOpen] = useState(false);
  const { data: alimentations, isLoading } = useAlimentations();
  const createAlim = useCreateAlimentation();

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
                    Le coût sera automatiquement réparti entre les bovins concernés.
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
                      <Label htmlFor="nb" className="text-xs">Nb bovins concernés</Label>
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
                  <TableHead className="text-center hidden sm:table-cell">Bovins</TableHead>
                  <TableHead className="text-right">Par tête</TableHead>
                  <TableHead className="hidden lg:table-cell">Commentaire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
