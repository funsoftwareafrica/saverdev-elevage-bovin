"use client";

// Vue Tableau de bord — synthèse des 6 blocs KPI SAVERDEV + alertes + historique.
// Données dynamiques via TanStack Query (useDashboard, useHistorique).

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard, useHistorique, useStatsComparaison, useStatsRaces } from "@/lib/api";
import { formatFCFA, formatFCFAShort, formatDate, severiteColor } from "@/lib/format";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { KpiCard, ViewHeader } from "./_shared";
import type { LucideIcon } from "lucide-react";
import {
  Beef,
  Salad,
  TrendingUp,
  TrendingDown,
  Minus,
  Landmark,
  AlertTriangle,
  Clock,
  Scale,
  Wallet,
  ShoppingCart,
  PiggyBank,
  Activity,
  History,
  ArrowUpRight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "@/lib/format";

export function DashboardView() {
  const { data: dash, isLoading } = useDashboard();
  const { data: historique } = useHistorique();

  if (isLoading || !dash) return <DashboardSkeleton />;

  const tauxUtilisation = Math.round(dash.financement.tauxUtilisation);
  const alertesActives = dash.alertes.filter((a) => !a.resolved);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Tableau de bord"
        description="Vue synthétique de l'exploitation — cheptel, engraissement, alimentation, rentabilité, financement, risques."
        icon={Activity}
      />

      {alertesActives.some((a) => a.severite === "CRITICAL") && (
        <Card className="border-red-200 bg-red-50/60">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-900">
                {alertesActives.filter((a) => a.severite === "CRITICAL").length} alerte(s) critique(s) à traiter
              </p>
              <p className="text-xs text-red-800/80 mt-0.5">
                {alertesActives.find((a) => a.severite === "CRITICAL")?.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <SectionTitle icon={Beef} title="Cheptel" subtitle="État du troupeau et mouvements" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Bovins actifs" value={dash.cheptel.bovinsActifs} icon={Beef} variant="primary" hint="En engraissement" trend="up" trendValue="+1 ce mois" />
          <KpiCard label="Bovins vendus" value={dash.cheptel.bovinsVendus} icon={ShoppingCart} variant="success" hint="Cumul" />
          <KpiCard label="Mortalité" value={dash.cheptel.mortalite} icon={AlertTriangle} variant={dash.cheptel.mortalite > 0 ? "danger" : "default"} hint="À surveiller" />
          <KpiCard label="Valeur du cheptel" value={formatFCFAShort(dash.cheptel.valeurCheptel)} icon={Wallet} hint="Estimation (achat + engrais.)" />
        </div>
      </section>

      <section>
        <SectionTitle icon={Scale} title="Engraissement" subtitle="Cycle d'engraissement et durée moyenne" />
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="Durée moyenne" value={`${dash.engraissement.dureeMoyenneJours} j`} icon={Clock} hint="Achat → vente" />
          <KpiCard label="Bovins en cycle" value={dash.engraissement.nbEnCycle} icon={Beef} variant="primary" />
          <KpiCard label="Poids moyen d'achat" value={`${dash.engraissement.poidsMoyen} kg`} icon={Scale} hint="À l'entrée" />
        </div>
      </section>

      <section>
        <SectionTitle icon={Salad} title="Alimentation" subtitle="Coût des aliments imputés par tête" />
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="Quantités" value={`${dash.alimentation.nbSacs} sacs`} icon={Salad} hint="Cumul achats" />
          <KpiCard label="Coût alimentation total" value={formatFCFAShort(dash.alimentation.coutTotal)} icon={Wallet} />
          <KpiCard label="Coût alimentation / tête" value={formatFCFA(dash.alimentation.coutParTete)} icon={PiggyBank} variant="warning" hint="Réparti par tête" />
        </div>
      </section>

      <section>
        <SectionTitle icon={TrendingUp} title="Rentabilité" subtitle="Chiffre d'affaires et marges" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Chiffre d'affaires" value={formatFCFAShort(dash.rentabilite.ca)} icon={ShoppingCart} variant="success" hint="Ventes réalisées" />
          <KpiCard label="Coût d'achat" value={formatFCFAShort(dash.rentabilite.coutAchat)} icon={Beef} />
          <KpiCard label="Coûts d'engraissement" value={formatFCFAShort(dash.rentabilite.coutEngraissement)} icon={Salad} />
          <KpiCard label="Marge totale" value={formatFCFAShort(dash.rentabilite.margeTotale)} icon={TrendingUp} variant={dash.rentabilite.margeTotale >= 0 ? "success" : "danger"} hint={`Marge / tête : ${formatFCFA(dash.rentabilite.margeParTete)}`} />
        </div>
      </section>

      <section>
        <SectionTitle icon={Landmark} title="Financement" subtitle="Suivi du financement SAVERDEV et échéances" />
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Taux d'utilisation</span>
                  <span className="text-lg font-bold text-primary tabular-nums">{tauxUtilisation}%</span>
                </div>
                <Progress value={tauxUtilisation} className="h-2.5" />
                <div className="flex justify-between text-[0.7rem] text-muted-foreground mt-1.5">
                  <span>Utilisé : {formatFCFAShort(dash.financement.montantUtilise)}</span>
                  <span>Accordé : {formatFCFAShort(dash.financement.montantFinance)}</span>
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-[0.65rem] uppercase text-muted-foreground">Payées</p><p className="text-lg font-bold text-emerald-700">{dash.financement.echeancesPayees}</p></div>
                  <div><p className="text-[0.65rem] uppercase text-muted-foreground">À payer</p><p className="text-lg font-bold text-amber-700">{dash.financement.echeancesAPayer}</p></div>
                  <div><p className="text-[0.65rem] uppercase text-muted-foreground">En retard</p><p className="text-lg font-bold text-red-700">{dash.financement.echeancesEnRetard}</p></div>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Solde disponible</span><span className="font-semibold tabular-nums">{formatFCFA(dash.financement.solde)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Montant utilisé</span><span className="font-semibold tabular-nums">{formatFCFA(dash.financement.montantUtilise)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Montant financé</span><span className="font-semibold tabular-nums">{formatFCFA(dash.financement.montantFinance)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* === COMPARAISON DE PÉRIODES === */}
      <ComparaisonSection />

      {/* === PERFORMANCE PAR RACE === */}
      <RacePerformanceSection />

      <section className="grid gap-4 lg:grid-cols-2" style={{ perspective: "1000px" }}>
        <Card className="hover-lift" style={{ transformStyle: "preserve-3d" }}>
          <CardHeader>
            <CardTitle className="text-sm">Évolution mensuelle — CA, coûts, marge</CardTitle>
            <CardDescription className="text-xs">8 derniers mois (FCFA)</CardDescription>
          </CardHeader>
          <CardContent className="h-72" style={{ transform: "translateZ(10px)", transformStyle: "preserve-3d" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dash.evolutionMensuelle} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.015 80)" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="oklch(0.55 0.02 50)" />
                <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 50)" tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")} domain={["dataMin", "dataMax"]} />
                <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid oklch(0.90 0.015 80)" }} />
                <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                <Line isAnimationActive animationDuration={1200} animationBegin={200} type="monotone" dataKey="ca" name="CA" stroke={CHART_COLORS.vertForet} strokeWidth={3} dot={{ r: 4 }} />
                <Line isAnimationActive animationDuration={1200} animationBegin={200} type="monotone" dataKey="couts" name="Coûts" stroke={CHART_COLORS.marronTerre} strokeWidth={3} dot={{ r: 4 }} />
                <Line isAnimationActive animationDuration={1200} animationBegin={200} type="monotone" dataKey="marge" name="Marge" stroke={CHART_COLORS.vertClair} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="hover-lift" style={{ transformStyle: "preserve-3d" }}>
          <CardHeader>
            <CardTitle className="text-sm">Répartition du cheptel</CardTitle>
            <CardDescription className="text-xs">Par statut</CardDescription>
          </CardHeader>
          <CardContent className="h-72" style={{ transform: "translateZ(10px)", transformStyle: "preserve-3d" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "En engraissement", value: dash.cheptel.bovinsActifs, fill: CHART_COLORS.vertForet },
                    { name: "Vendus", value: dash.cheptel.bovinsVendus, fill: CHART_COLORS.vertClair },
                    { name: "Mortalité", value: dash.cheptel.mortalite, fill: CHART_COLORS.rougeTerre },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  innerRadius={50}
                  paddingAngle={3}
                />
                <Tooltip contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2" style={{ perspective: "1000px" }}>
        <Card className="hover-lift" style={{ transformStyle: "preserve-3d" }}>
          <CardHeader>
            <CardTitle className="text-sm">Ventes par mois</CardTitle>
            <CardDescription className="text-xs">Montant des ventes (FCFA)</CardDescription>
          </CardHeader>
          <CardContent className="h-64" style={{ transform: "translateZ(10px)", transformStyle: "preserve-3d" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dash.ventesParMois} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.015 80)" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="oklch(0.55 0.02 50)" />
                <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 50)" tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")} />
                <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                <Bar isAnimationActive animationDuration={1000} animationBegin={300} dataKey="ventes" name="Ventes" fill={CHART_COLORS.vertForet} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="hover-lift" style={{ transformStyle: "preserve-3d" }}>
          <CardHeader className="flex flex-row items-center justify-between gap-2" style={{ transform: "translateZ(5px)" }}>
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Risques & alertes
              </CardTitle>
              <CardDescription className="text-xs">{alertesActives.length} alerte(s) active(s)</CardDescription>
            </div>
            <Badge variant="outline" className="text-[0.65rem]">{alertesActives.filter((a) => a.severite === "CRITICAL").length} critique(s)</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64 px-6 pb-4">
              <div className="space-y-2">
                {alertesActives.map((a) => (
                  <div key={a.id} className={`rounded-lg border px-3 py-2 ${severiteColor(a.severite)}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium leading-snug">{a.message}</p>
                      <span className="text-[0.6rem] uppercase font-semibold shrink-0">{a.type}</span>
                    </div>
                    <p className="text-[0.65rem] opacity-70 mt-1">{formatDate(a.date)}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>

      <Card className="hover-lift" style={{ transformStyle: "preserve-3d" }}>
        <CardHeader style={{ transform: "translateZ(5px)" }}>
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            Historique des opérations
          </CardTitle>
          <CardDescription className="text-xs">Journal des dernières actions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-72 px-6 pb-4">
            <div className="space-y-3 py-1">
              {(historique ?? []).map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[0.65rem] font-semibold">
                    {(h.user?.name ?? "?").slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">{h.details}</p>
                    <p className="text-[0.65rem] text-muted-foreground mt-0.5">{formatDate(h.date)} · {h.user?.name ?? "Système"} · {h.action}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                </div>
              ))}
              {(!historique || historique.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">Aucune opération enregistrée.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {subtitle && <span className="text-[0.7rem] text-muted-foreground hidden sm:inline">— {subtitle}</span>}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <ViewHeader title="Tableau de bord" description="Chargement des données..." icon={Activity} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <Skeleton className="h-48 rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}

// === COMPARAISON DE PÉRIODES (mois courant vs précédent) ===
function ComparaisonSection() {
  const { data: comp, isLoading } = useStatsComparaison();

  if (isLoading || !comp) return <Skeleton className="h-32 rounded-xl" />;

  const metrics = [
    { key: "ca", label: "CA", val: comp.ca, isGood: (d: number) => d >= 0 },
    { key: "marge", label: "Marge", val: comp.marge, isGood: (d: number) => d >= 0 },
    { key: "ventes", label: "Ventes", val: comp.ventes, isGood: (d: number) => d >= 0, isCount: true },
    { key: "depenses", label: "Dépenses", val: comp.depenses, isGood: (d: number) => d <= 0 },
    { key: "alimentation", label: "Alim.", val: comp.alimentation, isGood: (d: number) => d <= 0 },
  ];

  return (
    <section>
      <SectionTitle icon={TrendingUp} title="Comparaison" subtitle={`${comp.moisCourant} vs ${comp.moisPrecedent}`} />
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => {
          const d = m.val.delta;
          const good = m.isGood(d.pct);
          const curVal = m.isCount ? String(m.val.courant) : formatFCFAShort(m.val.courant);
          return (
            <div key={m.key} className="bg-white border border-border rounded-xl p-4 hover-lift">
              <p className="text-[0.65rem] uppercase text-muted-foreground font-medium">{m.label}</p>
              <p className="text-xl font-bold text-foreground tabular-nums mt-1">{curVal}</p>
              <div className="flex items-center gap-1 mt-1.5 text-[0.7rem] font-medium">
                {d.pct > 0 ? <TrendingUp className="h-3 w-3" /> : d.pct < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                <span className={good ? "text-emerald-600" : "text-red-600"}>
                  {d.pct === 0 ? "stable" : `${d.pct > 0 ? "+" : ""}${d.pct}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// === PERFORMANCE PAR RACE ===
function RacePerformanceSection() {
  const { data: races, isLoading } = useStatsRaces();

  if (isLoading || !races || races.length === 0) return <Skeleton className="h-64 rounded-xl" />;

  const maxMarge = Math.max(...races.map((r) => r.margeMoyenne), 1);
  const top3 = races.slice(0, 3);

  return (
    <section>
      <SectionTitle icon={Beef} title="Performance par race" subtitle="Classement par marge moyenne" />
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top 3 */}
        <div className="lg:col-span-1 space-y-3">
          <p className="text-[0.65rem] uppercase text-muted-foreground font-medium">Top performers</p>
          {top3.map((r, i) => (
            <div key={r.race} className={`rounded-xl border p-3 ${i === 0 ? "border-amber-200 bg-amber-50/50" : "border-border bg-white"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[0.65rem] font-bold ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : "bg-orange-300 text-white"}`}>{i + 1}</span>
                  <span className="text-sm font-semibold">{r.race}</span>
                </div>
                {i === 0 && <span className="text-lg">🏆</span>}
              </div>
              <div className="flex justify-between mt-2 text-[0.7rem] text-muted-foreground">
                <span>{r.total} bovins ({r.vendus} vendus)</span>
                <span className="font-semibold text-emerald-600">{formatFCFAShort(r.margeMoyenne)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Barres horizontales */}
        <div className="lg:col-span-2 bg-white border border-border rounded-xl p-4">
          <p className="text-[0.65rem] uppercase text-muted-foreground font-medium mb-3">Marge moyenne par race (FCFA)</p>
          <div className="space-y-3">
            {races.map((r) => (
              <div key={r.race} className="flex items-center gap-3">
                <span className="text-xs font-medium w-28 truncate">{r.race}</span>
                <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden">
                  <div className="h-full bg-primary rounded-md transition-all" style={{ width: `${(r.margeMoyenne / maxMarge) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold tabular-nums w-16 text-right">{formatFCFAShort(r.margeMoyenne)}</span>
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-4 gap-2 text-center text-[0.65rem]">
            <div><p className="text-muted-foreground">Bovins</p><p className="font-bold">{races.reduce((s,r)=>s+r.total,0)}</p></div>
            <div><p className="text-muted-foreground">Vendus</p><p className="font-bold">{races.reduce((s,r)=>s+r.vendus,0)}</p></div>
            <div><p className="text-muted-foreground">Durée moy.</p><p className="font-bold">{Math.round(races.reduce((s,r)=>s+r.dureeMoyenne,0)/races.length)} j</p></div>
            <div><p className="text-muted-foreground">Poids moy.</p><p className="font-bold">{Math.round(races.reduce((s,r)=>s+r.poidsMoyen,0)/races.length)} kg</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
