"use client";

// Vue Dépenses — soins vétérinaires, transport, main-d'œuvre, autres charges.

import { useState } from "react";
import { useDepenses, useCreateDepense } from "@/lib/api";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, Plus, Beef, Wallet, Stethoscope, Truck, Wrench, Users, CreditCard } from "lucide-react";
import { ViewHeader, KpiCard } from "./_shared";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "Soins vétérinaires", icon: Stethoscope, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { key: "Transport", icon: Truck, color: "text-sky-700 bg-sky-50 border-sky-200" },
  { key: "Main-d'œuvre", icon: Users, color: "text-amber-700 bg-amber-50 border-amber-200" },
  { key: "Autres", icon: Wrench, color: "text-muted-foreground bg-muted border-border" },
] as const;

export function DepensesView() {
  const role = useAppStore((s) => s.role);
  const readOnly = role === "BAILLEUR";
  const { data: depenses, isLoading } = useDepenses();
  const createDepense = useCreateDepense();
  const [filter, setFilter] = useState<string>("TOUS");
  const [open, setOpen] = useState(false);

  const allDepenses = depenses ?? [];
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
                <Button size="sm" className="bg-primary"><Plus className="h-4 w-4" /> Nouvelle dépense</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Enregistrer une dépense</DialogTitle>
                  <DialogDescription className="text-xs">Si des bovins sont concernés, le montant sera imputé à chacun.</DialogDescription>
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
                      <Label htmlFor="nb" className="text-xs">Nb bovins concernés</Label>
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
                  <TableHead className="text-center hidden sm:table-cell">Bovins</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
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
                          <Badge variant="outline" className="text-[0.65rem] gap-1"><Beef className="h-3 w-3" /> {d.nbBovinsConcernes}</Badge>
                        ) : <span className="text-[0.65rem] text-muted-foreground">Global</span>}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums font-medium">{formatFCFA(d.montant, false)}</TableCell>
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
