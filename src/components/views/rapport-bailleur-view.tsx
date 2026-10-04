"use client";

// Vue Rapport Bailleur — modèle Excel E2A (Tableau de Bord SAVERDEV)
// 6 KPI colorés + 6 graphiques + annexes imprimables.
// Données dynamiques via /api/rapport-bailleur (12 mois de l'exercice).

import { useRapportBailleur, useFinancement } from "@/lib/api";
import { HugeiconsIcon } from "@hugeicons/react";
import { RAPPORT_KPI_COLORS, COST_STRUCTURE_COLORS } from "@/lib/config";
import { formatFCFA, formatFCFAShort, formatDate, moisLabel, severiteColor, statutEcheanceColor } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { SaverdevLogo } from "@/components/saverdev-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LazyMount } from "@/components/lazy-mount";
import { FileText, Printer, Download, CheckCircle2, AlertCircle } from "@/lib/icons";
import { toast } from "sonner";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { motion } from "framer-motion";

// Couleurs du modèle Excel E2A (source : src/lib/config.ts)
const KPI_COLORS = RAPPORT_KPI_COLORS;
const DOUGHNUT_COLORS = [COST_STRUCTURE_COLORS.achatBovin, COST_STRUCTURE_COLORS.alimentation, COST_STRUCTURE_COLORS.autresCouts];

export function RapportBailleurView() {
  const selectedMonth = useAppStore((s) => s.selectedMonth);
  const year = selectedMonth ? parseInt(selectedMonth.split("-")[0], 10) : new Date().getFullYear();
  const { data: rap, isLoading } = useRapportBailleur(year);
  const { data: fin } = useFinancement();

  if (isLoading || !rap) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <HugeiconsIcon icon={FileText} size={5} className="text-primary" /> Rapport bailleur
        </h2>
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-16"/>)}</div>
      </div>
    );
  }

  const [y, m] = selectedMonth.split("-").map(Number);
  const moisLabelFull = moisLabel(m - 1) + " " + y;

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
            <HugeiconsIcon icon={FileText} size={5} className="text-primary" /> Rapport bailleur
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Tableau de bord — modèle E2A, exercice {year}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <HugeiconsIcon icon={Printer} size={4} /> Imprimer
          </Button>
          <Button size="sm" className="bg-primary" onClick={handlePrint}>
            <HugeiconsIcon icon={Download} size={4} /> Export PDF
          </Button>
        </div>
      </div>

      {/* ============ PAGE 1 : Tableau de bord ============ */}
      <Card className="print-page border-border shadow-sm">
        {/* En-tête — bandeau vert foncé comme le modèle Excel */}
        <div className="flex items-center justify-between gap-4 p-5 border-b border-border" style={{ background: "#14532A" }}>
          <div className="flex items-center gap-3">
            <SaverdevLogo size={48} variant="light" />
            <div>
              <h3 className="font-bold text-white text-lg">SAVERDEV DURABLE — Tableau de bord</h3>
              <p className="text-[0.65rem] uppercase tracking-wider text-white/70">Sahel Vert · Développement</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[0.65rem] uppercase tracking-wider text-white/70">Reporting mensuel destiné au bailleur</p>
            <p className="text-sm text-white/90">Exercice {year} · montants en FCFA</p>
          </div>
        </div>

        <CardContent className="p-5 space-y-5">
          {/* === 6 KPI colorés (modèle Excel E2A) === */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <RapportKpiCard label="Bovins actifs (fin)" value={String(rap.kpis.bovinsActifs)} color={KPI_COLORS.bovinsActifs} />
            <RapportKpiCard label="Chiffre d'affaires cumulé" value={formatFCFAShort(rap.kpis.caCumul)} color={KPI_COLORS.ca} />
            <RapportKpiCard label="Marge totale cumulée" value={formatFCFAShort(rap.kpis.margeTotale)} color={KPI_COLORS.marge} />
            <RapportKpiCard label="Marge moyenne / tête" value={formatFCFA(rap.kpis.margeParTete)} color={KPI_COLORS.margeParTete} />
            <RapportKpiCard label="Taux util. fin." value={`${Math.round(rap.kpis.tauxUtilisation)}%`} color={KPI_COLORS.tauxUtil} />
            <RapportKpiCard label="Trésorerie disponible" value={formatFCFAShort(rap.kpis.tresorerie)} color={KPI_COLORS.tresorerie} />
          </div>

          {/* === GRAPHIQUES (modèle Excel E2A — 6 charts) === */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. AreaChart — Évolution du cheptel */}
            <RapportChartCard title="Évolution du cheptel (bovins actifs)" height={220}>
              <LazyMount className="h-full" fallback={<Skeleton className="h-full w-full rounded-md" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rap.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rCheptel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={KPI_COLORS.bovinsActifs} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={KPI_COLORS.bovinsActifs} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10 }} stroke="#6B7280" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#6B7280" />
                    <Tooltip contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                    <Area isAnimationActive animationDuration={1000} type="monotone" dataKey="bovinsActifs" name="Bovins actifs" stroke={KPI_COLORS.bovinsActifs} strokeWidth={2.5} fill="url(#rCheptel)" />
                  </AreaChart>
                </ResponsiveContainer>
              </LazyMount>
            </RapportChartCard>

            {/* 2. BarChart — Achats vs Ventes */}
            <RapportChartCard title="Achats vs Ventes (têtes / mois)" height={220}>
              <LazyMount className="h-full" fallback={<Skeleton className="h-full w-full rounded-md" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rap.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10 }} stroke="#6B7280" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#6B7280" />
                    <Tooltip contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                    <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                    <Bar isAnimationActive animationDuration={1000} dataKey="achats" name="Achats" fill="#1E6091" radius={[3, 3, 0, 0]} />
                    <Bar isAnimationActive animationDuration={1000} dataKey="ventes" name="Ventes" fill="#10B981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </LazyMount>
            </RapportChartCard>

            {/* 3. BarChart — CA & marge */}
            <RapportChartCard title="Chiffre d'affaires & marge (FCFA / mois)" height={220}>
              <LazyMount className="h-full" fallback={<Skeleton className="h-full w-full rounded-md" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rap.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10 }} stroke="#6B7280" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#6B7280" tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")} />
                    <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                    <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                    <Bar isAnimationActive animationDuration={1000} dataKey="ca" name="CA" fill="#1E6091" radius={[3, 3, 0, 0]} />
                    <Bar isAnimationActive animationDuration={1000} dataKey="margeTotale" name="Marge" fill="#14532A" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </LazyMount>
            </RapportChartCard>

            {/* 4. LineChart — Marge/tête & coût alimentation/tête */}
            <RapportChartCard title="Marge/tête & coût alimentation/tête" height={220}>
              <LazyMount className="h-full" fallback={<Skeleton className="h-full w-full rounded-md" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rap.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10 }} stroke="#6B7280" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#6B7280" tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")} />
                    <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                    <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                    <Line isAnimationActive animationDuration={1200} type="monotone" dataKey="margeParTete" name="Marge/tête" stroke="#0F766E" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line isAnimationActive animationDuration={1200} type="monotone" dataKey="coutAlimParTete" name="Coût alim./tête" stroke="#E0A008" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </LazyMount>
            </RapportChartCard>

            {/* 5. Pie/Donut — Structure des coûts (cumul) */}
            <RapportChartCard title="Structure des coûts (cumul)" height={220}>
              <LazyMount className="h-full" fallback={<Skeleton className="h-full w-full rounded-md" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Achat des bovins", value: rap.costStructure.achatBovins },
                        { name: "Alimentation", value: rap.costStructure.alimentation },
                        { name: "Engraissement (autres)", value: rap.costStructure.engraissement },
                      ]}
                      dataKey="value" nameKey="name" cx="50%" cy="50%"
                      outerRadius={80} innerRadius={45} paddingAngle={3}
                      isAnimationActive animationDuration={1000}
                    >
                      {DOUGHNUT_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                    <Legend wrapperStyle={{ fontSize: "0.65rem" }} iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </LazyMount>
            </RapportChartCard>

            {/* 6. BarChart — Financement utilisé vs trésorerie */}
            <RapportChartCard title="Financement utilisé (cumul) vs trésorerie" height={220}>
              <LazyMount className="h-full" fallback={<Skeleton className="h-full w-full rounded-md" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rap.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10 }} stroke="#6B7280" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#6B7280" tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")} />
                    <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                    <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                    <Bar isAnimationActive animationDuration={1000} dataKey="financementUtilise" name="Financement utilisé" fill="#E0A008" radius={[3, 3, 0, 0]} />
                    <Bar isAnimationActive animationDuration={1000} dataKey="tresorerie" name="Trésorerie" fill="#8D6E63" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </LazyMount>
            </RapportChartCard>
          </div>
        </CardContent>
      </Card>

      {/* ============ PAGE 2 : Annexes détaillées ============ */}
      <Card className="print-page border-border shadow-sm">
        <CardHeader className="bg-secondary/5 border-b border-border">
          <CardTitle className="text-sm">Annexe — Détail des ventes, bovins actifs et échéances</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          {/* Tableau mensuel récapitulatif */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Récapitulatif mensuel — exercice {year}</h4>
            <div className="rounded-md border border-border overflow-x-auto">
              <table className="w-full text-xs min-w-[800px]">
                <thead className="bg-muted/60">
                  <tr className="text-left">
                    <th className="p-2 font-medium">Mois</th>
                    <th className="p-2 font-medium text-right">Actifs</th>
                    <th className="p-2 font-medium text-right">Achats</th>
                    <th className="p-2 font-medium text-right">Ventes</th>
                    <th className="p-2 font-medium text-right">CA</th>
                    <th className="p-2 font-medium text-right">Coût alim.</th>
                    <th className="p-2 font-medium text-right">Marge</th>
                    <th className="p-2 font-medium text-right">Marge/tête</th>
                    <th className="p-2 font-medium text-right">Trésorerie</th>
                  </tr>
                </thead>
                <tbody>
                  {rap.monthly.map((row) => (
                    <tr key={row.mois} className="border-t border-border">
                      <td className="p-2 font-medium">{row.mois}</td>
                      <td className="p-2 text-right tabular-nums">{row.bovinsActifs}</td>
                      <td className="p-2 text-right tabular-nums">{row.achats}</td>
                      <td className="p-2 text-right tabular-nums">{row.ventes}</td>
                      <td className="p-2 text-right tabular-nums">{row.ca > 0 ? formatFCFAShort(row.ca) : "—"}</td>
                      <td className="p-2 text-right tabular-nums">{row.coutAlimentation > 0 ? formatFCFAShort(row.coutAlimentation) : "—"}</td>
                      <td className={`p-2 text-right tabular-nums font-medium ${row.margeTotale >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {row.ca > 0 || row.margeTotale !== 0 ? formatFCFAShort(row.margeTotale) : "—"}
                      </td>
                      <td className="p-2 text-right tabular-nums">{row.ventes > 0 ? formatFCFA(row.margeParTete, false) : "—"}</td>
                      <td className={`p-2 text-right tabular-nums ${row.tresorerie >= 0 ? "" : "text-red-600"}`}>{formatFCFAShort(row.tresorerie)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Échéances détaillées */}
          {fin && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tableau d'amortissement — {fin.bailleur}</h4>
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
          )}

          {/* Alertes & faits marquants */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <HugeiconsIcon icon={AlertCircle} size={3} className=".5 .5" /> Alertes & faits marquants
            </h4>
            <div className="space-y-2">
              {rap.alertes.filter((a) => !a.resolved).map((a) => (
                <div key={a.id} className={`rounded-md border px-3 py-2 text-xs ${severiteColor(a.severite)}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{a.message}</span>
                    <span className="text-[0.6rem] uppercase font-semibold">{a.severite}</span>
                  </div>
                </div>
              ))}
              {rap.alertes.filter((a) => !a.resolved).length === 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <HugeiconsIcon icon={CheckCircle2} size={4} /> Aucune alerte active.
                </div>
              )}
            </div>
          </div>

          {/* Pied de page du rapport */}
          <div className="pt-4 border-t border-border text-[0.65rem] text-muted-foreground text-center">
            Document généré le {formatDate(new Date().toISOString())} · SAVERDEV DURABLE — Sahel Vert pour un Développement Durable · Confidentiel
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ====== Sous-composants ======

// KPI coloré — style identique au modèle Excel E2A
function RapportKpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="rounded-lg p-3 text-white shadow-md"
      style={{ background: color }}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider leading-tight">{label}</p>
      <p className="text-xl font-bold tabular-nums mt-1.5">{value}</p>
    </motion.div>
  );
}

// Carte conteneur pour graphique
function RapportChartCard({ title, height, children }: { title: string; height: number; children: React.ReactNode }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height }} className="pt-1">
        {children}
      </CardContent>
    </Card>
  );
}
