"use client";

// Vue Ventes & sorties — enregistrement des ventes + calcul automatique de la marge.

import { useState } from "react";
import { MOCK_BOVINS, computeBovinMarge } from "@/lib/mock-data";
import { formatFCFA, formatDate } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Plus, TrendingUp, TrendingDown, Calendar, User } from "lucide-react";
import { ViewHeader, KpiCard } from "./_shared";
import { toast } from "sonner";

export function VentesView() {
  const role = useAppStore((s) => s.role);
  const readOnly = role === "BAILLEUR";
  const [open, setOpen] = useState(false);

  const vendus = MOCK_BOVINS.filter((b) => b.statut === "VENDU");
  const ca = vendus.reduce((s, b) => s + b.prixVente, 0);
  const margeTotale = vendus.reduce((s, b) => {
    const { marge } = computeBovinMarge(b);
    return s + (marge ?? 0);
  }, 0);
  const margeMoyenne = vendus.length ? margeTotale / vendus.length : 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Vente enregistrée", { description: "Marge calculée automatiquement." });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Ventes & sorties"
        description="Enregistrement des ventes — marge calculée automatiquement (prix de vente – coût de revient)."
        icon={ShoppingCart}
        action={
          !readOnly && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary"><Plus className="h-4 w-4" /> Enregistrer une vente</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer une vente</DialogTitle>
                  <DialogDescription className="text-xs">Le coût de revient sera figé et la marge calculée.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bovin" className="text-xs">Bovin vendu</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Sélectionner un bovin actif" /></SelectTrigger>
                      <SelectContent>
                        {MOCK_BOVINS.filter((b) => b.statut === "EN_ENGRAISSEMENT").map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.identifiant} — {b.race} ({formatFCFA(b.prixAchat + b.coutsEngraissement, false)} revient)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="prix" className="text-xs">Prix de vente (FCFA)</Label>
                      <Input id="prix" type="number" placeholder="550000" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="date" className="text-xs">Date de vente</Label>
                      <Input id="date" type="date" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="client" className="text-xs">Client</Label>
                    <Input id="client" placeholder="Boucherie, restaurant, marché..." />
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
        <KpiCard label="Bovins vendus" value={vendus.length} icon={ShoppingCart} variant="primary" />
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
                  <TableHead>Bovin</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Client</TableHead>
                  <TableHead className="text-right">Prix vente</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Coût revient</TableHead>
                  <TableHead className="text-right">Marge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendus.map((b) => {
                  const { coutRevient, marge } = computeBovinMarge(b);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono font-semibold text-primary text-sm">{b.identifiant}</TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3 w-3" /> {formatDate(b.dateVente)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{b.clientVente ?? "—"}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatFCFA(b.prixVente, false)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums hidden lg:table-cell text-muted-foreground">{formatFCFA(coutRevient, false)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums font-medium">
                        {marge !== null && marge >= 0 ? (
                          <span className="text-emerald-700 flex items-center justify-end gap-0.5"><TrendingUp className="h-3 w-3" />{formatFCFA(marge, false)}</span>
                        ) : (
                          <span className="text-red-700 flex items-center justify-end gap-0.5"><TrendingDown className="h-3 w-3" />{formatFCFA(marge ?? 0, false)}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
