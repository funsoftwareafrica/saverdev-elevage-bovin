"use client";

// Vue Rapport Bailleur — synthèse mensuelle imprimable (PDF via navigateur).
// Lecture seule, orientée supervision : cheptel, rentabilité, financement, alertes.

import { useDashboard, useBovins, useFinancement } from "@/lib/api";
import { computeBovinMarge } from "@/lib/calculations";
import { formatFCFA, formatFCFAShort, formatDate, moisLabel, severiteColor, statutBovinColor, statutEcheanceColor } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { SaverdevLogo } from "@/components/saverdev-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { FileText, Printer, Download, CheckCircle2, AlertCircle, Beef, TrendingUp, Landmark } from "lucide-react";
import { toast } from "sonner";

export function RapportBailleurView() {
  const selectedMonth = useAppStore((s) => s.selectedMonth);
  const { data: dash } = useDashboard();
  const { data: bovins } = useBovins();
  const { data: fin } = useFinancement();

  if (!dash || !bovins || !fin) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Rapport bailleur
        </h2>
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-16"/>)}</div>
      </div>
    );
  }

  const vendus = bovins.filter((b) => b.statut === "VENDU");
  const actifs = bovins.filter((b) => b.statut === "EN_ENGRAISSEMENT");

  // Parse mois sélectionné
  const [y, m] = selectedMonth.split("-").map(Number);
  const moisLabelFull = moisLabel(m - 1) + " " + y;

  const tauxUtilisation = dash.financement.tauxUtilisation;
  const tauxMarge = dash.rentabilite.ca > 0 ? (dash.rentabilite.margeTotale / dash.rentabilite.ca) * 100 : 0;

  const handlePrint = () => {
    toast.info("Préparation du PDF...", { description: "Utilisez « Imprimer » puis « Enregistrer en PDF »." });
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="space-y-6">
      {/* Bandeau d'actions (non imprimé) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Rapport bailleur
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Synthèse mensuelle — lecture seule, exportable en PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Imprimer
          </Button>
          <Button size="sm" className="bg-primary" onClick={handlePrint}>
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* ============ PAGE 1 : Synthèse ============ */}
      <Card className="print-page border-border shadow-sm">
        {/* En-tête du rapport */}
        <div className="flex items-center justify-between gap-4 p-5 border-b border-border bg-secondary/5">
          <div className="flex items-center gap-3">
            <SaverdevLogo size={48} variant="light" />
            <div>
              <h3 className="font-bold text-foreground text-lg">SAVERDEV</h3>
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Sahel Vert · Développement</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Rapport mensuel</p>
            <p className="text-lg font-bold text-primary">{moisLabelFull}</p>
            <p className="text-[0.7rem] text-muted-foreground">Élevage bovin d'engraissement</p>
          </div>
        </div>

        <CardContent className="p-5 space-y-5">
          {/* KPI synthétiques */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ReportKpi label="Bovins actifs" value={String(dash.cheptel.bovinsActifs)} hint="En engraissement" />
            <ReportKpi label="Bovins vendus" value={String(dash.cheptel.bovinsVendus)} hint="Cumul" />
            <ReportKpi label="Chiffre d'affaires" value={formatFCFAShort(dash.rentabilite.ca)} hint="Ventes réalisées" />
            <ReportKpi label="Marge totale" value={formatFCFAShort(dash.rentabilite.margeTotale)} hint={`${tauxMarge.toFixed(0)}% du CA`} highlight={dash.rentabilite.margeTotale >= 0 ? "positive" : "negative"} />
          </div>

          <Separator />

          {/* Situation du cheptel */}
          <ReportSection title="1. Situation du cheptel" icon={Beef}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <KV label="Bovins actifs" value={String(dash.cheptel.bovinsActifs)} />
              <KV label="Bovins vendus (cumul)" value={String(dash.cheptel.bovinsVendus)} />
              <KV label="Mortalité" value={String(dash.cheptel.mortalite)} />
              <KV label="Valeur du cheptel" value={formatFCFA(dash.cheptel.valeurCheptel)} />
              <KV label="Durée moyenne d'engraissement" value={`${dash.engraissement.dureeMoyenneJours} j`} />
              <KV label="Poids moyen d'achat" value={`${dash.engraissement.poidsMoyen} kg`} />
              <KV label="Coût alimentation / tête" value={formatFCFA(dash.alimentation.coutParTete)} />
              <KV label="Quantités cumulées" value={`${dash.alimentation.nbSacs} sacs`} />
            </div>
          </ReportSection>

          {/* Rentabilité */}
          <ReportSection title="2. Rentabilité" icon={TrendingUp}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <KV label="Chiffre d'affaires" value={formatFCFA(dash.rentabilite.ca)} />
              <KV label="Coût d'achat" value={formatFCFA(dash.rentabilite.coutAchat)} />
              <KV label="Coûts d'engraissement" value={formatFCFA(dash.rentabilite.coutEngraissement)} />
              <KV label="Marge par tête" value={formatFCFA(dash.rentabilite.margeParTete)} />
              <KV label="Marge totale" value={formatFCFA(dash.rentabilite.margeTotale)} highlight={dash.rentabilite.margeTotale >= 0 ? "positive" : "negative"} />
              <KV label="Taux de marge" value={`${tauxMarge.toFixed(1)}%`} />
            </div>
          </ReportSection>

          {/* Financement */}
          <ReportSection title="3. Situation du financement" icon={Landmark}>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Taux d'utilisation</span>
                  <span className="font-bold text-primary tabular-nums">{tauxUtilisation.toFixed(0)}%</span>
                </div>
                <Progress value={tauxUtilisation} className="h-2" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <KV label="Montant financé" value={formatFCFA(dash.financement.montantFinance)} />
                <KV label="Utilisé" value={formatFCFA(dash.financement.montantUtilise)} />
                <KV label="Solde" value={formatFCFA(dash.financement.solde)} />
                <KV label="En retard" value={`${dash.financement.echeancesEnRetard} échéance(s)`} highlight={dash.financement.echeancesEnRetard > 0 ? "negative" : undefined} />
              </div>
            </div>
          </ReportSection>

          {/* Alertes & faits marquants */}
          <ReportSection title="4. Alertes & faits marquants" icon={AlertCircle}>
            <div className="space-y-2">
              {dash.alertes.filter((a) => !a.resolved).map((a) => (
                <div key={a.id} className={`rounded-md border px-3 py-2 text-xs ${severiteColor(a.severite)}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{a.message}</span>
                    <span className="text-[0.6rem] uppercase font-semibold">{a.severite}</span>
                  </div>
                </div>
              ))}
              {dash.alertes.filter((a) => !a.resolved).length === 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Aucune alerte active ce mois.
                </div>
              )}
            </div>
          </ReportSection>

          {/* Commentaire de gestion */}
          <ReportSection title="5. Commentaire de gestion" icon={FileText}>
            <div className="rounded-md bg-muted/40 border border-border p-3 text-xs leading-relaxed text-foreground/90">
              <p>
                Au cours du mois de <strong>{moisLabelFull}</strong>, l'exploitation compte {dash.cheptel.bovinsActifs} bovins en engraissement
                pour une valeur estimée à {formatFCFA(dash.cheptel.valeurCheptel)}. Le chiffre d'affaires cumulé s'établit à
                {formatFCFA(dash.rentabilite.ca)} pour une marge totale de {formatFCFA(dash.rentabilite.margeTotale)}
                ({tauxMarge.toFixed(1)}% du CA), soit {formatFCFA(dash.rentabilite.margeParTete)} par tête vendue.
              </p>
              <p className="mt-2">
                L'utilisation du financement SAVERDEV atteint {tauxUtilisation.toFixed(0)}% ({formatFCFA(dash.financement.montantUtilise)} / {formatFCFA(dash.financement.montantFinance)}).
                {dash.financement.echeancesEnRetard > 0 && (
                  <> <strong className="text-red-700">Attention : {dash.financement.echeancesEnRetard} échéance(s) en retard à régulariser.</strong></>
                )} Le solde disponible est de {formatFCFA(dash.financement.solde)}.
              </p>
            </div>
          </ReportSection>
        </CardContent>
      </Card>

      {/* ============ PAGE 2 : Annexes détaillées ============ */}
      <Card className="print-page border-border shadow-sm">
        <CardHeader className="bg-secondary/5 border-b border-border">
          <CardTitle className="text-sm">Annexe — Détail des ventes et échéances</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          {/* Ventes détaillées */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Ventes du mois et cumul</h4>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/60">
                  <tr className="text-left">
                    <th className="p-2 font-medium">Bovin</th>
                    <th className="p-2 font-medium hidden sm:table-cell">Date</th>
                    <th className="p-2 font-medium text-right">Prix vente</th>
                    <th className="p-2 font-medium text-right hidden md:table-cell">Coût revient</th>
                    <th className="p-2 font-medium text-right">Marge</th>
                    <th className="p-2 font-medium text-center">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {vendus.map((b) => {
                    const { coutRevient, marge } = computeBovinMarge(b);
                    return (
                      <tr key={b.id} className="border-t border-border">
                        <td className="p-2 font-mono font-semibold text-primary">{b.identifiant}</td>
                        <td className="p-2 hidden sm:table-cell text-muted-foreground">{formatDate(b.dateVente)}</td>
                        <td className="p-2 text-right tabular-nums">{formatFCFA(b.prixVente, false)}</td>
                        <td className="p-2 text-right tabular-nums hidden md:table-cell text-muted-foreground">{formatFCFA(coutRevient, false)}</td>
                        <td className={`p-2 text-right tabular-nums font-medium ${marge !== null && marge >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                          {marge !== null ? formatFCFA(marge, false) : "—"}
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant="outline" className={`text-[0.6rem] ${statutBovinColor(b.statut)}`}>Vendu</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bovins actifs */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Bovins en engraissement</h4>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/60">
                  <tr className="text-left">
                    <th className="p-2 font-medium">Bovin</th>
                    <th className="p-2 font-medium">Race</th>
                    <th className="p-2 font-medium hidden sm:table-cell">Achat</th>
                    <th className="p-2 font-medium text-right">Prix achat</th>
                    <th className="p-2 font-medium text-right hidden md:table-cell">Coûts engrais.</th>
                  </tr>
                </thead>
                <tbody>
                  {actifs.map((b) => (
                    <tr key={b.id} className="border-t border-border">
                      <td className="p-2 font-mono font-semibold text-primary">{b.identifiant}</td>
                      <td className="p-2">{b.race}</td>
                      <td className="p-2 hidden sm:table-cell text-muted-foreground">{formatDate(b.dateAchat)}</td>
                      <td className="p-2 text-right tabular-nums">{formatFCFA(b.prixAchat, false)}</td>
                      <td className="p-2 text-right tabular-nums hidden md:table-cell">{formatFCFA(b.coutsEngraissement + b.autresCouts, false)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Échéances détaillées */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tableau d'amortissement — SAVERDEV</h4>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/60">
                  <tr className="text-left">
                    <th className="p-2 font-medium">N°</th>
                    <th className="p-2 font-medium">Date prévue</th>
                    <th className="p-2 font-medium hidden sm:table-cell">Date payée</th>
                    <th className="p-2 font-medium text-right">Montant</th>
                    <th className="p-2 font-medium text-center">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {fin.echeances.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="p-2 font-mono font-semibold">{e.numero}</td>
                      <td className="p-2">{formatDate(e.datePrevue)}</td>
                      <td className="p-2 hidden sm:table-cell text-muted-foreground">{e.datePayee ? formatDate(e.datePayee) : "—"}</td>
                      <td className="p-2 text-right tabular-nums">{formatFCFA(e.montant, false)}</td>
                      <td className="p-2 text-center">
                        <Badge variant="outline" className={`text-[0.6rem] ${statutEcheanceColor(e.statut)}`}>
                          {e.statut === "PAYEE" ? "Payée" : e.statut === "A_PAYER" ? "À payer" : "En retard"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pied de page du rapport */}
          <div className="pt-4 border-t border-border text-[0.65rem] text-muted-foreground text-center">
            Document généré le {formatDate(new Date().toISOString())} · SAVERDEV — Sahel Vert pour un Développement Durable · Confidentiel
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sous-composants du rapport
function ReportKpi({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: "positive" | "negative" }) {
  const color = highlight === "positive" ? "text-emerald-700" : highlight === "negative" ? "text-red-700" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold tabular-nums mt-1 ${color}`}>{value}</p>
      {hint && <p className="text-[0.6rem] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function ReportSection({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold flex items-center gap-2 mb-2 text-foreground">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h4>
      {children}
    </div>
  );
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: "positive" | "negative" }) {
  const color = highlight === "positive" ? "text-emerald-700" : highlight === "negative" ? "text-red-700" : "text-foreground";
  return (
    <div className="flex flex-col">
      <span className="text-[0.65rem] text-muted-foreground">{label}</span>
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
