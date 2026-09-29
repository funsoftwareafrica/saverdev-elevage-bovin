"use client";

// Vue Bovins — liste du cheptel avec filtres par statut + accès à la fiche détaillée.

import { useMemo, useState } from "react";
import { useBovins } from "@/lib/api";
import { computeBovinMarge } from "@/lib/calculations";
import { formatFCFA, formatDate, statutBovinColor, joursEntre } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Beef, Search, Eye, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { ViewHeader, EmptyState, KpiCard } from "./_shared";
import type { StatutBovin } from "@/lib/types";

export function BovinsView() {
  const openBovin = useAppStore((s) => s.openBovin);
  const { data: bovins, isLoading } = useBovins();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"TOUS" | StatutBovin>("TOUS");

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

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Cheptel — Bovins"
        description="Liste des bovins, statuts et marges. Cliquez sur un bovin pour ouvrir sa fiche."
        icon={Beef}
        action={
          <Button size="sm" className="bg-primary">
            <Plus className="h-4 w-4" /> Nouvel achat
          </Button>
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
