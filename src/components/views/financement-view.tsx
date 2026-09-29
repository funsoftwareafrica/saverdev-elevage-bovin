"use client";

// Vue Financement & Bailleur — suivi du financement SAVERDEV, échéances et trésorerie.

import { useFinancement } from "@/lib/api";
import { formatFCFA, formatFCFAShort, formatDate, statutEcheanceColor } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Landmark, Wallet, CalendarClock, CheckCircle2, AlertCircle, Clock, PiggyBank } from "lucide-react";
import { ViewHeader, KpiCard } from "./_shared";
// pas de useMemo ici pour éviter le lint react-hooks/preserve-manual-memoization

export function FinancementView() {
  const { data: fin, isLoading } = useFinancement();

  if (isLoading || !fin) {
    return (
      <div className="space-y-6">
        <ViewHeader title="Financement & Bailleur" description="Chargement..." icon={Landmark} />
        <div className="grid gap-3 sm:grid-cols-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-28"/>)}</div>
        <Skeleton className="h-48"/>
      </div>
    );
  }

  const echeances = fin.echeances;

  const payees = echeances.filter((e) => e.statut === "PAYEE");
  const aPayer = echeances.filter((e) => e.statut === "A_PAYER");
  const enRetard = echeances.filter((e) => e.statut === "EN_RETARD");

  const montantUtilise = payees.reduce((s, e) => s + e.montant, 0);
  const tauxUtilisation = (montantUtilise / fin.montantFinance) * 100;
  const solde = fin.montantFinance - montantUtilise;

  // Prochaines échéances (à payer + en retard), triées par date
  const prochaines = [...aPayer, ...enRetard]
    .sort((a, b) => new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Financement & Bailleur"
        description="Suivi du financement SAVERDEV, utilisation des fonds et échéances de remboursement."
        icon={Landmark}
      />

      {/* KPI financement */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Montant financé" value={formatFCFA(fin.montantFinance)} icon={Landmark} variant="primary" hint={`Bailleur : ${fin.bailleur}`} />
        <KpiCard label="Montant utilisé" value={formatFCFA(montantUtilise)} icon={Wallet} hint={`${tauxUtilisation.toFixed(0)}% du financement`} />
        <KpiCard label="Solde disponible" value={formatFCFA(solde)} icon={PiggyBank} variant="success" />
        <KpiCard
          label="Échéances en retard"
          value={enRetard.length}
          icon={AlertCircle}
          variant={enRetard.length > 0 ? "danger" : "default"}
          hint={`${payees.length} payée(s) · ${aPayer.length} à payer`}
        />
      </div>

      {/* Carte principale : taux d'utilisation + prochaines échéances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Utilisation du financement</CardTitle>
          <CardDescription className="text-xs">
            Octroyé le {formatDate(fin.dateOctroi)} · {fin.dureeMois} mois · taux {fin.tauxInteret}% annuel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Taux d'utilisation</span>
                <span className="text-2xl font-bold text-primary tabular-nums">{tauxUtilisation.toFixed(0)}%</span>
              </div>
              <Progress value={tauxUtilisation} className="h-3" />
              <div className="flex justify-between text-[0.7rem] text-muted-foreground mt-1.5">
                <span>{formatFCFAShort(montantUtilise)} utilisé</span>
                <span>{formatFCFAShort(fin.montantFinance)} accordé</span>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Montant financé</span><span className="tabular-nums font-medium">{formatFCFA(fin.montantFinance)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Capital remboursé</span><span className="tabular-nums font-medium">{formatFCFA(montantUtilise)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Solde à utiliser</span><span className="tabular-nums font-medium text-emerald-700">{formatFCFA(solde)}</span></div>
              </div>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Prochaines échéances</h4>
              <div className="space-y-2">
                {prochaines.map((e) => (
                  <div key={e.id} className={`rounded-lg border px-3 py-2 ${statutEcheanceColor(e.statut)}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {e.statut === "EN_RETARD" ? <AlertCircle className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
                        <div>
                          <p className="text-sm font-semibold">Échéance n°{e.numero}</p>
                          <p className="text-[0.65rem] opacity-80">{formatDate(e.datePrevue)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold tabular-nums">{formatFCFA(e.montant, false)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des échéances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tableau d'amortissement — échéances</CardTitle>
          <CardDescription className="text-xs">{echeances.length} échéances mensuelles de {formatFCFA(echeances[0]?.montant ?? 0)}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[45vh] overflow-auto scroll-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                <TableRow>
                  <TableHead className="w-[60px]">N°</TableHead>
                  <TableHead>Date prévue</TableHead>
                  <TableHead className="hidden sm:table-cell">Date payée</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {echeances.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono font-semibold text-xs">{e.numero}</TableCell>
                    <TableCell className="text-xs">{formatDate(e.datePrevue)}</TableCell>
                    <TableCell className="text-xs hidden sm:table-cell text-muted-foreground">{e.datePayee ? formatDate(e.datePayee) : "—"}</TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{formatFCFA(e.montant, false)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-[0.65rem] ${statutEcheanceColor(e.statut)}`}>
                        {e.statut === "PAYEE" ? "Payée" : e.statut === "A_PAYER" ? "À payer" : "En retard"}
                      </Badge>
                    </TableCell>
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
