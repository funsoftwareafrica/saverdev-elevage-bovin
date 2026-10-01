"use client";

// Vue Bovins — liste du cheptel avec filtres par statut + accès à la fiche détaillée.
// Bouton "Nouvel achat" avec Dialog form fonctionnel.

import { useMemo, useState } from "react";
import { useBovins, useCreateBovin } from "@/lib/api";
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
import { Beef, Search, Eye, Plus, TrendingUp, TrendingDown, Database, Download } from "lucide-react";
import { ViewHeader, EmptyState, KpiCard } from "./_shared";
import { exportCSV } from "@/lib/export";
import type { StatutBovin } from "@/lib/types";

import { toast } from "sonner";

export function BovinsView() {
  const openBovin = useAppStore((s) => s.openBovin);
  
  const role = useAppStore((s) => s.role);
  const readOnly = role === "BAILLEUR";
  const { data: bovins, isLoading } = useBovins();
  const createBovin = useCreateBovin();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"TOUS" | StatutBovin>("TOUS");
  const [open, setOpen] = useState(false);

  const allBovins = bovins ?? [];
  const filtered = useMemo(() => {
    return allBovins.filter((b) => {
      if (filter !== "TOUS" && b.statut !== filter) return false;
      if (search && !b.identifiant.toLowerCase().includes(search.toLowerCase()) && !b.race.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, filter, allBovins]);

  const actifs = allBovins.filter((b) => b.statut === "EN_ENGRAISSEMENT");
  const vendus = allBovins.filter((b) => b.statut === "VENDU");
  const valeurCheptel = actifs.reduce((s, b) => s + b.prixAchat + b.coutsEngraissement, 0);

  const handleExport = () => {
    exportCSV(
      filtered.map((b) => {
        const { coutRevient, marge } = computeBovinMarge(b);
        return { identifiant: b.identifiant, race: b.race, sexe: b.sexe, dateAchat: formatDate(b.dateAchat), prixAchat: b.prixAchat, poidsAchat: b.poidsAchat, statut: b.statut, coutsEngraissement: b.coutsEngraissement, autresCouts: b.autresCouts, prixVente: b.prixVente, coutRevient, marge: marge ?? "" };
      }),
      [
        { key: "identifiant", label: "Identifiant" },
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
      "bovins.csv"
    );
    toast.success("Export CSV", { description: `${filtered.length} bovin(s) exporté(s)` });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createBovin.mutate(
      {
        race: String(fd.get("race") || "Zébu"),
        sexe: String(fd.get("sexe") || "Mâle"),
        dateAchat: String(fd.get("dateAchat") || new Date().toISOString().slice(0, 10)),
        prixAchat: Number(fd.get("prixAchat") || 0),
        poidsAchat: Number(fd.get("poidsAchat") || 0),
      },
      {
        onSuccess: () => {
          toast.success("Bovin enregistré", { description: "Nouvel achat ajouté au cheptel" });
          setOpen(false);
        },
        onError: () => toast.error("Échec de l'enregistrement"),
      }
    );
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Cheptel — Bovins"
        description="Liste des bovins, statuts et marges. Cliquez sur un bovin pour ouvrir sa fiche."
        icon={Database}
        action={
          !readOnly && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary">
                    <Plus className="h-4 w-4" /> Nouvel achat
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Enregistrer un nouvel achat</DialogTitle>
                    <DialogDescription className="text-xs">
                      Un identifiant BOV-XXX sera généré automatiquement.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={onSubmit} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="race" className="text-xs">Race</Label>
                      <Input id="race" name="race" placeholder="Zébu Gobra" defaultValue="Zébu" required />
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
                        <Input id="prixAchat" name="prixAchat" type="number" placeholder="450000" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="poidsAchat" className="text-xs">Poids d'achat (kg)</Label>
                        <Input id="poidsAchat" name="poidsAchat" type="number" placeholder="280" required />
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

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Bovins actifs" value={actifs.length} icon={Beef} variant="primary" />
        <KpiCard label="Bovins vendus" value={vendus.length} icon={TrendingUp} variant="success" />
        <KpiCard label="Valeur du cheptel actif" value={formatFCFA(valeurCheptel)} icon={Beef} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (BOV-001, Zébu...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="h-9">
                <TabsTrigger value="TOUS" className="text-xs">Tous ({allBovins.length})</TabsTrigger>
                <TabsTrigger value="EN_ENGRAISSEMENT" className="text-xs">Actifs ({actifs.length})</TabsTrigger>
                <TabsTrigger value="VENDU" className="text-xs">Vendus ({vendus.length})</TabsTrigger>
              </TabsList>
            </Tabs>
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
                    <TableHead>Race</TableHead>
                    <TableHead className="hidden sm:table-cell">Achat</TableHead>
                    <TableHead className="text-right">Prix achat</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Coûts engrais.</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Coût revient</TableHead>
                    <TableHead className="text-right">Marge</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <EmptyState icon={Beef} title="Aucun bovin trouvé" description="Modifiez votre recherche ou filtre." />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((b) => {
                      const { coutRevient, marge } = computeBovinMarge(b);
                      return (
                        <TableRow
                          key={b.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => openBovin(b.id)}
                        >
                          <TableCell className="font-mono font-semibold text-primary">{b.identifiant}</TableCell>
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
                                <TrendingUp className="h-3 w-3" />{formatFCFA(marge, false)}
                              </span>
                            ) : (
                              <span className="text-red-700 flex items-center justify-end gap-0.5">
                                <TrendingDown className="h-3 w-3" />{formatFCFA(marge, false)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[0.65rem] ${statutBovinColor(b.statut)}`}>
                              {b.statut === "EN_ENGRAISSEMENT" ? "En engrais." : b.statut === "VENDU" ? "Vendu" : "Mort"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
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
    </div>
  );
}
