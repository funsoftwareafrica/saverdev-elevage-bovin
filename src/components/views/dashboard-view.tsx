"use client";

// Vue Tableau de bord — synthèse SAVERDEV enrichie avec graphismes avancés.
// Jauges radiales · aires dégradées · sparklines · anneaux · radar · composed.
// Données dynamiques via TanStack Query (useDashboard, useHistorique, ...).

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard, useHistorique, useStatsComparaison, useStatsRaces } from "@/lib/api";
import { formatFCFA, formatFCFAShort, formatDate, severiteColor, CHART_COLORS } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { KpiCard, ViewHeader } from "./_shared";
import { AnimatedCounter } from "@/components/animated-counter";
import { LazyMount } from "@/components/lazy-mount";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Beef, Salad, TrendingUp, TrendingDown, Minus, Landmark, AlertTriangle,
  Clock, Scale, Wallet, ShoppingCart, PiggyBank, Activity, History,
  ArrowUpRight, Target, Percent, Coins, Gauge, BarChart3, Trophy,
} from "@/lib/icons";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart,
  Legend, Line, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  RadialBar, RadialBarChart, Radar, RadarChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

export function DashboardView() {
  const { data: dash, isLoading } = useDashboard();
  const { data: historique } = useHistorique();

  if (isLoading || !dash) return <DashboardSkeleton />;

  const tauxUtilisation = Math.round(dash.financement.tauxUtilisation);
  const alertesActives = dash.alertes.filter((a) => !a.resolved);
  const totalBovins = dash.cheptel.bovinsActifs + dash.cheptel.bovinsVendus + dash.cheptel.mortalite;
  const tauxMortalite = totalBovins > 0 ? Math.round((dash.cheptel.mortalite / totalBovins) * 100) : 0;
  const tauxMarge = dash.rentabilite.ca > 0
    ? Math.round((dash.rentabilite.margeTotale / dash.rentabilite.ca) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <DashboardHeader3D />

      {/* === BANDEAU ALERTE CRITIQUE — 3D animé === */}
      {alertesActives.some((a) => a.severite === "CRITICAL") && (
        <AlertBanner3D
          count={alertesActives.filter((a) => a.severite === "CRITICAL").length}
          message={alertesActives.find((a) => a.severite === "CRITICAL")?.message ?? ""}
        />
      )}

      {/* === HERO KPI STRIP — 4 grosses tuiles animées === */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <HeroKpi
          icon={Beef} label="Bovins actifs" value={dash.cheptel.bovinsActifs}
          suffix=" têtes" color="emerald" trend="+1 ce mois" trendUp
          sparkData={dash.evolutionMensuelle.map((e, i) => ({ v: 8 + i }))}
        />
        <HeroKpi
          icon={Wallet} label="Valeur cheptel" value={dash.cheptel.valeurCheptel}
          formatter={formatFCFAShort} color="teal"
          sparkData={dash.evolutionMensuelle.map(() => ({ v: Math.random() * 4 + 3 }))}
        />
        <HeroKpi
          icon={ShoppingCart} label="Chiffre d'affaires" value={dash.rentabilite.ca}
          formatter={formatFCFAShort} color="amber"
          sparkData={dash.ventesParMois.map((v) => ({ v: v.ventes }))}
        />
        <HeroKpi
          icon={TrendingUp} label="Marge totale" value={dash.rentabilite.margeTotale}
          formatter={formatFCFAShort} color={dash.rentabilite.margeTotale >= 0 ? "emerald" : "red"}
          hint={`Marge / tête : ${formatFCFA(dash.rentabilite.margeParTete)}`}
          sparkData={dash.evolutionMensuelle.map((e) => ({ v: e.marge }))}
        />
      </section>

      {/* === SECTION CHEPTEL === */}
      <section>
        <SectionTitle icon={Beef} title="Cheptel" subtitle="État du troupeau et mouvements" />
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          {/* KPI cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            <KpiCard label="Bovins actifs" value={dash.cheptel.bovinsActifs} icon={Beef} variant="primary" hint="En engraissement" trend="up" trendValue="+1 ce mois" />
            <KpiCard label="Bovins vendus" value={dash.cheptel.bovinsVendus} icon={ShoppingCart} variant="success" hint="Cumul" />
            <KpiCard label="Mortalité" value={dash.cheptel.mortalite} icon={AlertTriangle} variant={dash.cheptel.mortalite > 0 ? "danger" : "default"} hint="À surveiller" />
            <KpiCard label="Valeur du cheptel" value={formatFCFAShort(dash.cheptel.valeurCheptel)} icon={Wallet} hint="Estimation (achat + engrais.)" />
          </div>
          {/* Donut cheptel */}
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4 text-primary" />Répartition du cheptel</CardTitle>
              <CardDescription className="text-xs">Par statut ({totalBovins} têtes)</CardDescription>
            </CardHeader>
            <CardContent className="h-56">
              <LazyMount height={224} fallback={<Skeleton className="h-full w-full rounded-md" />}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="gActif" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#34D399" />
                    </linearGradient>
                    <linearGradient id="gVendu" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#A78BFA" />
                    </linearGradient>
                    <linearGradient id="gMort" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#EF4444" /><stop offset="100%" stopColor="#FCA5A5" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={[
                      { name: "En engraissement", value: dash.cheptel.bovinsActifs, fill: "url(#gActif)" },
                      { name: "Vendus", value: dash.cheptel.bovinsVendus, fill: "url(#gVendu)" },
                      { name: "Mortalité", value: dash.cheptel.mortalite, fill: "url(#gMort)" },
                    ]}
                    dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={75} innerRadius={45} paddingAngle={3}
                    isAnimationActive animationDuration={1000}
                  />
                  <Tooltip contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                  <Legend wrapperStyle={{ fontSize: "0.65rem" }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
              </LazyMount>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* === SECTION ENGRAISSEMENT + ALIMENTATION === */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><HugeiconsIcon icon={Scale} size={16} className="text-primary" />Engraissement</CardTitle>
            <CardDescription className="text-xs">Cycle d'engraissement et durée moyenne</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <MiniStat label="Durée moyenne" value={`${dash.engraissement.dureeMoyenneJours} j`} icon={Clock} />
              <MiniStat label="Bovins en cycle" value={dash.engraissement.nbEnCycle} icon={Beef} accent />
              <MiniStat label="Poids moy. achat" value={`${dash.engraissement.poidsMoyen} kg`} icon={Scale} />
            </div>
            {/* Barre de progression durée cycle */}
            <div>
              <div className="flex justify-between text-[0.7rem] text-muted-foreground mb-1">
                <span>Progression moyenne du cycle</span>
                <span className="font-semibold text-foreground">{Math.min(100, Math.round((dash.engraissement.dureeMoyenneJours / 180) * 100))}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${Math.min(100, (dash.engraissement.dureeMoyenneJours / 180) * 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
                />
              </div>
              <p className="text-[0.6rem] text-muted-foreground mt-1">Réf. cycle optimal : 180 jours</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><HugeiconsIcon icon={Salad} size={16} className="text-primary" />Alimentation</CardTitle>
            <CardDescription className="text-xs">Coût des aliments imputés par tête</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <MiniStat label="Quantités" value={`${dash.alimentation.nbSacs}`} suffix=" sacs" icon={Salad} />
              <MiniStat label="Coût total" value={formatFCFAShort(dash.alimentation.coutTotal)} icon={Wallet} />
              <MiniStat label="Coût / tête" value={formatFCFA(dash.alimentation.coutParTete)} icon={PiggyBank} accent warning />
            </div>
            {/* Mini bar chart alimentation par mois */}
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dash.ventesParMois.map((v, i) => ({ mois: v.mois, alim: 60 + i * 12 }))}>
                  <XAxis dataKey="mois" tick={{ fontSize: 9 }} stroke="oklch(0.65 0.02 50)" interval={0} />
                  <Bar dataKey="alim" fill="#10B981" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={800} />
                  <Tooltip contentStyle={{ fontSize: "0.7rem", borderRadius: "0.5rem" }} formatter={(v: number) => `${v} sacs`} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* === SECTION RENTABILITÉ — graphismes avancés === */}
      <RentabiliteSection
        ca={dash.rentabilite.ca}
        coutAchat={dash.rentabilite.coutAchat}
        coutEngraissement={dash.rentabilite.coutEngraissement}
        margeTotale={dash.rentabilite.margeTotale}
        margeParTete={dash.rentabilite.margeParTete}
      />

      {/* === GRAPHIQUES PRINCIPAUX === */}
      <section className="grid gap-4 lg:grid-cols-3" style={{ perspective: "1000px" }}>
        {/* Évolution mensuelle — AIRE avec dégradés */}
        <Card className="hover-lift lg:col-span-2" style={{ transformStyle: "preserve-3d" }}>
          <CardHeader style={{ transform: "translateZ(5px)" }}>
            <CardTitle className="text-sm flex items-center gap-2"><HugeiconsIcon icon={Activity} size={16} className="text-primary" />Évolution mensuelle — CA, coûts, marge</CardTitle>
            <CardDescription className="text-xs">Évolution sur la période d'activité (FCFA)</CardDescription>
          </CardHeader>
          <CardContent className="h-72" style={{ transform: "translateZ(10px)" }}>
            <LazyMount height={288} fallback={<Skeleton className="h-full w-full rounded-md" />}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dash.evolutionMensuelle} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} /><stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gCouts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.35} /><stop offset="100%" stopColor="#EF4444" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gMarge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} /><stop offset="100%" stopColor="#F59E0B" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.015 80)" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="oklch(0.55 0.02 50)" />
                <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 50)" tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")} />
                <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid oklch(0.90 0.015 80)" }} />
                <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                <Area isAnimationActive animationDuration={1200} type="monotone" dataKey="ca" name="CA" stroke="#10B981" strokeWidth={2.5} fill="url(#gCA)" />
                <Area isAnimationActive animationDuration={1200} animationBegin={200} type="monotone" dataKey="couts" name="Coûts" stroke="#EF4444" strokeWidth={2.5} fill="url(#gCouts)" />
                <Area isAnimationActive animationDuration={1200} animationBegin={400} type="monotone" dataKey="marge" name="Marge" stroke="#F59E0B" strokeWidth={2.5} fill="url(#gMarge)" />
              </AreaChart>
            </ResponsiveContainer>
            </LazyMount>
          </CardContent>
        </Card>

        {/* Jauge taux de marge — RadialBar */}
        <Card className="hover-lift" style={{ transformStyle: "preserve-3d" }}>
          <CardHeader style={{ transform: "translateZ(5px)" }}>
            <CardTitle className="text-sm flex items-center gap-2"><HugeiconsIcon icon={Gauge} size={16} className="text-primary" />Taux de marge</CardTitle>
            <CardDescription className="text-xs">Marge / CA</CardDescription>
          </CardHeader>
          <CardContent className="h-72" style={{ transform: "translateZ(10px)", perspective: "800px" }}>
            <motion.div className="h-full w-full" style={{ transformStyle: "preserve-3d" }} whileHover={{ rotateX: 12, transition: { duration: 0.3 } }}>
            <LazyMount height={288} fallback={<Skeleton className="h-full w-full rounded-md" />}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="65%" outerRadius="100%" data={[{ name: "Marge", value: Math.max(0, tauxMarge), fill: "#10B981" }]}
                startAngle={90} endAngle={-270}
              >
                <defs>
                  <linearGradient id="gGaugeMarge" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#34D399" /><stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={12} fill="url(#gGaugeMarge)" isAnimationActive animationDuration={1200} background={{ fill: "oklch(0.94 0.01 80)" }} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-foreground">
                  {tauxMarge}%
                </text>
                <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" className="text-[0.65rem] fill-muted-foreground">
                  {formatFCFAShort(dash.rentabilite.margeTotale)}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
            </LazyMount>
            </motion.div>
          </CardContent>
        </Card>
      </section>

      {/* === SECTION FINANCEMENT — jauge + échéances === */}
      <section>
        <SectionTitle icon={Landmark} title="Financement" subtitle="Suivi du financement SAVERDEV et échéances" />
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          {/* Jauge taux utilisation */}
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Taux d'utilisation</CardTitle>
              <CardDescription className="text-xs">Capital mobilisé</CardDescription>
            </CardHeader>
            <CardContent className="h-44">
              <LazyMount height={176} fallback={<Skeleton className="h-full w-full rounded-md" />}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%" outerRadius="100%"
                  data={[{ name: "Utilisé", value: tauxUtilisation, fill: "#14B8A6" }]}
                  startAngle={90} endAngle={-270}
                >
                  <defs>
                    <linearGradient id="gGaugeFin" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#14B8A6" /><stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={10} fill="url(#gGaugeFin)" isAnimationActive animationDuration={1200} background={{ fill: "oklch(0.94 0.01 80)" }} />
                  <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-foreground">
                    {tauxUtilisation}%
                  </text>
                  <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="text-[0.6rem] fill-muted-foreground">
                    {formatFCFAShort(dash.financement.montantUtilise)} / {formatFCFAShort(dash.financement.montantFinance)}
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
              </LazyMount>
            </CardContent>
          </Card>

          {/* Anneaux échéances */}
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Échéances</CardTitle>
              <CardDescription className="text-xs">Statut des remboursements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around">
                <EcheanceRing count={dash.financement.echeancesPayees} total={dash.financement.echeancesPayees + dash.financement.echeancesAPayer + dash.financement.echeancesEnRetard} label="Payées" color="#10B981" />
                <EcheanceRing count={dash.financement.echeancesAPayer} total={dash.financement.echeancesPayees + dash.financement.echeancesAPayer + dash.financement.echeancesEnRetard} label="À payer" color="#F59E0B" />
                <EcheanceRing count={dash.financement.echeancesEnRetard} total={dash.financement.echeancesPayees + dash.financement.echeancesAPayer + dash.financement.echeancesEnRetard} label="En retard" color="#EF4444" />
              </div>
              <Separator className="my-3" />
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Solde disponible</span><span className="font-semibold tabular-nums">{formatFCFA(dash.financement.solde)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Montant utilisé</span><span className="font-semibold tabular-nums">{formatFCFA(dash.financement.montantUtilise)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Montant financé</span><span className="font-semibold tabular-nums">{formatFCFA(dash.financement.montantFinance)}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Coûts ventilés — stacked bar */}
          <Card className="hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><HugeiconsIcon icon={BarChart3} size={16} className="text-primary" />Ventilation des coûts</CardTitle>
              <CardDescription className="text-xs">Décomposition par poste (FCFA)</CardDescription>
            </CardHeader>
            <CardContent className="h-44">
              <LazyMount height={176} fallback={<Skeleton className="h-full w-full rounded-md" />}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { poste: "Achat bovin", value: dash.rentabilite.coutAchat, fill: "#F59E0B" },
                  { poste: "Alimentation", value: dash.alimentation.coutTotal, fill: "#10B981" },
                  { poste: "Autres coûts", value: dash.rentabilite.coutEngraissement, fill: "#3B82F6" },
                ]} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.015 80)" />
                  <XAxis dataKey="poste" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 50)" />
                  <YAxis tick={{ fontSize: 9 }} stroke="oklch(0.55 0.02 50)" tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")} />
                  <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.7rem", borderRadius: "0.5rem" }} />
                  <Bar dataKey="value" isAnimationActive animationDuration={1000} radius={[4, 4, 0, 0]}>
                    <Cell fill="#F59E0B" />
                    <Cell fill="#10B981" />
                    <Cell fill="#3B82F6" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </LazyMount>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* === COMPARAISON DE PÉRIODES === */}
      <ComparaisonSection />

      {/* === PERFORMANCE PAR RACE === */}
      <RacePerformanceSection />

      {/* === RADAR + VENTES === */}
      <section className="grid gap-4 lg:grid-cols-2" style={{ perspective: "1000px" }}>
        {/* Radar performance globale */}
        <Card className="hover-lift" style={{ transformStyle: "preserve-3d" }}>
          <CardHeader style={{ transform: "translateZ(5px)" }}>
            <CardTitle className="text-sm flex items-center gap-2"><HugeiconsIcon icon={Target} size={16} className="text-primary" />Profil de performance</CardTitle>
            <CardDescription className="text-xs">Vision multi-critères (0-100)</CardDescription>
          </CardHeader>
          <CardContent className="h-64" style={{ transform: "translateZ(10px)" }}>
            <LazyMount height={256} fallback={<Skeleton className="h-full w-full rounded-md" />}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { critere: "Rentabilité", score: Math.min(100, Math.max(0, tauxMarge + 30)) },
                { critere: "Cheptel", score: Math.min(100, dash.cheptel.bovinsActifs * 8) },
                { critere: "Ventes", score: Math.min(100, dash.cheptel.bovinsVendus * 20) },
                { critere: "Aliment.", score: Math.min(100, Math.round(dash.alimentation.coutParTete / 5000)) },
                { critere: "Financ.", score: tauxUtilisation },
                { critere: "Cycle", score: Math.min(100, Math.round((dash.engraissement.dureeMoyenneJours / 180) * 100)) },
              ]}>
                <PolarGrid stroke="oklch(0.85 0.02 80)" />
                <PolarAngleAxis dataKey="critere" tick={{ fontSize: 10, fill: "oklch(0.45 0.02 50)" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="score" stroke="#10B981" strokeWidth={2} fill="#10B981" fillOpacity={0.3} isAnimationActive animationDuration={1200} />
                <Tooltip contentStyle={{ fontSize: "0.7rem", borderRadius: "0.5rem" }} />
              </RadarChart>
            </ResponsiveContainer>
            </LazyMount>
          </CardContent>
        </Card>

        {/* Ventes par mois — Composed bar+line */}
        <Card className="hover-lift" style={{ transformStyle: "preserve-3d" }}>
          <CardHeader style={{ transform: "translateZ(5px)" }}>
            <CardTitle className="text-sm">Ventes & têtes vendues</CardTitle>
            <CardDescription className="text-xs">Montant (FCFA) et nombre de têtes</CardDescription>
          </CardHeader>
          <CardContent className="h-64" style={{ transform: "translateZ(10px)" }}>
            <LazyMount height={256} fallback={<Skeleton className="h-full w-full rounded-md" />}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dash.ventesParMois} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gVentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.85} /><stop offset="100%" stopColor="#10B981" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.015 80)" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="oklch(0.55 0.02 50)" />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 50)" tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 50)" domain={[0, 5]} />
                <Tooltip contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} formatter={(v: number, n: string) => n === "ventes" ? formatFCFA(v) : `${v} têtes`} />
                <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                <Bar yAxisId="left" isAnimationActive animationDuration={1000} dataKey="ventes" name="Ventes (FCFA)" fill="url(#gVentes)" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" isAnimationActive animationDuration={1200} type="monotone" dataKey="nbTetes" name="Têtes" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
            </LazyMount>
          </CardContent>
        </Card>
      </section>

      {/* === ALERTES + HISTORIQUE === */}
      <section className="grid gap-4 lg:grid-cols-2" style={{ perspective: "1000px" }}>
        <Card className="hover-lift" style={{ transformStyle: "preserve-3d" }}>
          <CardHeader className="flex flex-row items-center justify-between gap-2" style={{ transform: "translateZ(5px)" }}>
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <HugeiconsIcon icon={AlertTriangle} size={16} className="text-amber-600" />
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
                {alertesActives.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Aucune alerte active.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="hover-lift" style={{ transformStyle: "preserve-3d" }}>
          <CardHeader style={{ transform: "translateZ(5px)" }}>
            <CardTitle className="text-sm flex items-center gap-2">
              <HugeiconsIcon icon={History} size={16} className="text-muted-foreground" />
              Historique des opérations
            </CardTitle>
            <CardDescription className="text-xs">Journal des dernières actions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-64 px-6 pb-4">
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
                    <HugeiconsIcon icon={ArrowUpRight} size={12} className=".5 .5 text-muted-foreground shrink-0 mt-1" />
                  </div>
                ))}
                {(!historique || historique.length === 0) && (
                  <p className="text-xs text-muted-foreground text-center py-4">Aucune opération enregistrée.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ============================================================
//   SOUS-COMPOSANTS GRAPHIQUES
// ============================================================

// --- EN-TÊTE 3D : titre "Tableau de bord" avec parallaxe souris ---
function DashboardHeader3D() {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 18 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <div ref={ref} style={{ perspective: "1200px" }} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: 25 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.10] via-emerald-50/50 to-teal-50/40 p-5 sm:p-6 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.30),0_8px_20px_-4px_rgba(16,185,129,0.15)]"
      >
        {/* Halo radial animé en fond */}
        <motion.div
          aria-hidden
          className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.85, 0.6] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl"
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4" style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }}>
            {/* Cube 3D isométrique avec rotation permanente + icône */}
            <motion.div
              className="relative shrink-0"
              style={{ width: 56, height: 56, transformStyle: "preserve-3d" }}
              initial={{ rotateX: -25, rotateY: -25 }}
              animate={{ rotateY: 360 }}
              transition={{ rotateY: { duration: 14, repeat: Infinity, ease: "linear" }, rotateX: { duration: 0 }}
              }>
              {/* Face avant */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.5)] flex items-center justify-center" style={{ transform: "translateZ(14px)" }}>
                <HugeiconsIcon icon={Activity} size={28} className="text-white" />
              </div>
              {/* Face arrière */}
              <div className="absolute inset-0 rounded-xl bg-emerald-700" style={{ transform: "translateZ(-14px) rotateY(180deg)" }} />
              {/* Face droite */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700" style={{ transform: "rotateY(90deg) translateZ(14px)", width: "100%" }} />
              {/* Face gauche */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800" style={{ transform: "rotateY(-90deg) translateZ(14px)", width: "100%" }} />
              {/* Face haut */}
              <div className="absolute inset-0 rounded-xl bg-emerald-400/90" style={{ transform: "rotateX(90deg) translateZ(14px)", width: "100%" }} />
              {/* Face bas */}
              <div className="absolute inset-0 rounded-xl bg-teal-800/80" style={{ transform: "rotateX(-90deg) translateZ(14px)", width: "100%" }} />
            </motion.div>

            <div style={{ transform: "translateZ(30px)" }}>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gradient">
                Tableau de bord
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Vue synthétique de l'exploitation — cheptel, engraissement, alimentation, rentabilité, financement, risques.
              </p>
            </div>
          </div>

          {/* Indicateur live flottant */}
          <motion.div
            className="flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3.5 py-2 border border-primary/30 shadow-[0_4px_15px_rgba(16,185,129,0.15)]"
            style={{ transform: "translateZ(55px)" }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.span
              className="h-2.5 w-2.5 rounded-full bg-primary"
              animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-[0.7rem] font-semibold text-foreground">Données en direct</span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// --- BANDEAU ALERTE 3D : parallaxe + icône qui pulse en 3D ---
function AlertBanner3D({ count, message }: { count: number; message: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 16 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 200, damping: 16 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <motion.div
      initial={{ opacity: 0, x: -30, rotateY: -25 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      ref={ref}
      style={{ perspective: "1000px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative overflow-hidden rounded-2xl border border-red-300/70 bg-gradient-to-r from-red-50 via-red-50/80 to-red-50/30 shadow-[0_15px_40px_-10px_rgba(239,68,68,0.35),0_5px_15px_-3px_rgba(239,68,68,0.2)]"
      >
        {/* Coin plié 3D en haut à droite */}
        <div className="absolute top-0 right-0 z-20" style={{ transform: "translateZ(1px)" }}>
          <div className="relative w-0 h-0 border-l-[28px] border-l-transparent border-t-[28px] border-t-red-500" style={{ transformStyle: "preserve-3d" }}>
            <div className="absolute top-[-28px] right-0 w-[28px] h-[28px] bg-gradient-to-bl from-red-100 to-red-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1)]" style={{ transform: "rotateY(35deg)", transformOrigin: "right", clipPath: "polygon(0 0, 100% 100%, 0 100%)" }} />
          </div>
        </div>

        {/* Barre rouge gauche avec pulsation 3D */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-red-400 via-red-500 to-red-600 rounded-l-2xl"
          style={{ transform: "translateZ(15px)" }}
          animate={{ opacity: [1, 0.5, 1], scaleX: [1, 1.3, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Halo rouge flottant */}
        <motion.div
          aria-hidden
          className="absolute -right-8 top-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-red-400/25 blur-2xl"
          animate={{ scale: [1, 1.35, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative p-4 sm:p-5 flex items-center gap-4 pl-7">
          {/* Icône AlertTriangle 3D avec cube rouge + anneaux pulsants */}
          <div className="relative h-14 w-14 shrink-0 flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
            {/* Anneaux pulsants */}
            <motion.div
              className="absolute inset-0 rounded-full bg-red-200/60"
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-red-400"
              animate={{ scale: [1, 1.7, 1], opacity: [0.9, 0, 0.9] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
            {/* Cube rouge 3D avec rotation */}
            <motion.div
              className="relative"
              style={{ width: 40, height: 40, transformStyle: "preserve-3d", transform: "translateZ(25px)" }}
              animate={{ rotateY: [0, 360], rotateX: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg" style={{ transform: "translateZ(10px)" }}>
                <HugeiconsIcon icon={AlertTriangle} size={20} className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-lg bg-red-700" style={{ transform: "translateZ(-10px) rotateY(180deg)" }} />
              <div className="absolute inset-0 rounded-lg bg-red-500" style={{ transform: "rotateY(90deg) translateZ(10px)", width: "100%" }} />
              <div className="absolute inset-0 rounded-lg bg-red-800" style={{ transform: "rotateY(-90deg) translateZ(10px)", width: "100%" }} />
            </motion.div>
          </div>

          {/* Texte avec profondeur */}
          <div className="flex-1 min-w-0" style={{ transform: "translateZ(25px)" }}>
            <div className="flex items-center gap-2">
              <motion.span
                className="inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-red-600 text-white text-[0.7rem] font-bold tabular-nums shadow-[0_2px_8px_rgba(239,68,68,0.4)]"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              >
                {count}
              </motion.span>
              <p className="text-sm font-bold text-red-900">
                alerte{count > 1 ? "s" : ""} critique{count > 1 ? "s" : ""} à traiter
              </p>
            </div>
            <p className="text-xs text-red-800/85 mt-1 font-medium">{message}</p>
          </div>

          {/* Badge URGENT 3D flottant */}
          <motion.div
            className="hidden sm:flex items-center rounded-md bg-red-600 px-2.5 py-1 shadow-[0_4px_12px_rgba(239,68,68,0.35)]"
            style={{ transform: "translateZ(35px)" }}
            animate={{ y: [0, -3, 0], rotate: [0, -2, 2, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-[0.65rem] font-bold text-white tracking-wider">URGENT</span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- SECTION RENTABILITÉ — waterfall + barre empilée + jauges ---
function RentabiliteSection({
  ca, coutAchat, coutEngraissement, margeTotale, margeParTete,
}: {
  ca: number; coutAchat: number; coutEngraissement: number; margeTotale: number; margeParTete: number;
}) {
  const totalCouts = coutAchat + coutEngraissement;
  const tauxMarge = ca > 0 ? Math.round((margeTotale / ca) * 100) : 0;
  const tauxCoutAchat = ca > 0 ? Math.round((coutAchat / ca) * 100) : 0;
  const tauxCoutEngrais = ca > 0 ? Math.round((coutEngraissement / ca) * 100) : 0;

  // Données waterfall : CA (start) → -Coût achat → -Coût engrais → Marge (end)
  const waterfallData = [
    { label: "CA", value: ca, type: "total", color: "#10B981" },
    { label: "Coût achat", value: -coutAchat, type: "negative", color: "#EF4444" },
    { label: "Coût engrais.", value: -coutEngraissement, type: "negative", color: "#F59E0B" },
    { label: "Marge", value: margeTotale, type: "total", color: margeTotale >= 0 ? "#14B8A6" : "#EF4444" },
  ];

  // Calcul des positions cumulées pour le waterfall
  let cumul = 0;
  const bars = waterfallData.map((item) => {
    let base = 0, hauteur = 0;
    if (item.type === "total") {
      base = 0;
      hauteur = item.value;
      cumul = item.value;
    } else {
      base = cumul + item.value; // item.value est négatif
      hauteur = Math.abs(item.value);
      cumul = base;
    }
    return { ...item, base, hauteur };
  });

  const maxVal = ca;
  const chartH = 200;

  return (
    <section>
      <SectionTitle icon={TrendingUp} title="Rentabilité" subtitle="Chiffre d'affaires et marges" />

      {/* Ligne 1 : 4 KPI cards avec mini jauges */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <RentabiliteKpi
          icon={ShoppingCart} label="Chiffre d'affaires" value={formatFCFAShort(ca)}
          color="#10B981" pct={100} hint="Ventes réalisées" sub={`${tauxCoutAchat + tauxCoutEngrais}% absorbé`}
        />
        <RentabiliteKpi
          icon={Beef} label="Coût d'achat" value={formatFCFAShort(coutAchat)}
          color="#EF4444" pct={tauxCoutAchat} hint="Bétail acheté" sub={`${tauxCoutAchat}% du CA`}
        />
        <RentabiliteKpi
          icon={Salad} label="Coûts d'engraissement" value={formatFCFAShort(coutEngraissement)}
          color="#F59E0B" pct={tauxCoutEngrais} hint="Alimentation + soins" sub={`${tauxCoutEngrais}% du CA`}
        />
        <RentabiliteKpi
          icon={TrendingUp} label="Marge totale" value={formatFCFAShort(margeTotale)}
          color={margeTotale >= 0 ? "#14B8A6" : "#EF4444"} pct={Math.min(100, tauxMarge)}
          hint={`Marge / tête : ${formatFCFA(margeParTete)}`} sub={`${tauxMarge}% du CA`}
        />
      </div>

      {/* Ligne 2 : waterfall + barre empilée + jauge marge */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Waterfall chart (cascade de marge) */}
        <Card className="hover-lift lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><HugeiconsIcon icon={BarChart3} size={16} className="text-primary" />Cascade de marge</CardTitle>
            <CardDescription className="text-xs">Du CA à la marge — décomposition (FCFA)</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {/* Waterfall HTML/CSS — cascade CA → -coûts → marge */}
            {(() => {
              const containerH = 240; // px
              return (
                <div style={{ height: containerH + 30 }}>
                  <div className="flex items-end justify-around gap-3 h-full pt-4 pb-2">
                    {bars.map((b, i) => {
                      const barH = Math.max(14, Math.round((b.hauteur / maxVal) * containerH));
                      const spacerH = b.type === "total" ? 0 : Math.round((b.base / maxVal) * containerH);
                      return (
                        <div key={i} className="flex-1 max-w-[100px] h-full flex flex-col justify-end items-center">
                          {/* Valeur au-dessus */}
                          <div
                            className="text-[0.7rem] font-bold tabular-nums mb-1 whitespace-nowrap"
                            style={{ color: b.color }}
                          >
                            {b.value >= 0 ? "+" : ""}{formatFCFAShort(b.value).replace(" FCFA", "")}
                          </div>
                          {/* Espace flottant (effet waterfall) */}
                          <div style={{ height: spacerH }} />
                          {/* Barre */}
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: barH }}
                            transition={{ delay: 0.2 + i * 0.15, duration: 0.7, ease: "easeOut" }}
                            className="w-full max-w-[56px] rounded-t-md relative"
                            style={{
                              background: `linear-gradient(180deg, ${b.color}, ${b.color}dd)`,
                              minHeight: "10px",
                            }}
                          >
                            <div className="absolute inset-0 rounded-t-md bg-gradient-to-b from-white/30 to-transparent" />
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Labels sous les barres */}
                  <div className="flex justify-around gap-3">
                    {bars.map((b, i) => (
                      <p key={i} className="flex-1 max-w-[100px] text-[0.65rem] text-muted-foreground text-center truncate">
                        {b.label}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })()}
            {/* Légende */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-[0.65rem]">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-emerald-500" /> Revenu</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-red-500" /> Coût achat</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-amber-500" /> Coût engrais.</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded bg-teal-600" /> Marge</span>
              <span className="ml-auto font-semibold text-foreground">Total coûts : {formatFCFAShort(totalCouts)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Jauge taux de marge 3D + répartition */}
        <Card className="hover-lift relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><HugeiconsIcon icon={Gauge} size={16} className="text-primary" />Taux de marge</CardTitle>
            <CardDescription className="text-xs">Marge nette / CA</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Jauge demi-circulaire */}
            <div className="relative h-32 flex items-end justify-center">
              <svg viewBox="0 0 100 60" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="gMargeGauge" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="50%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#14B8A6" />
                  </linearGradient>
                </defs>
                {/* Arc fond */}
                <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="oklch(0.94 0.01 80)" strokeWidth="10" strokeLinecap="round" />
                {/* Arc valeur */}
                <motion.path
                  d="M 10 55 A 40 40 0 0 1 90 55"
                  fill="none" stroke="url(#gMargeGauge)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray="125.6" // demi-cercle = π*40
                  initial={{ strokeDashoffset: 125.6 }}
                  animate={{ strokeDashoffset: 125.6 - (125.6 * Math.min(100, tauxMarge)) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                />
                {/* Aiguille */}
                <motion.line
                  x1="50" y1="55"
                  x2="50" y2="20"
                  stroke="#0F172A" strokeWidth="1.5" strokeLinecap="round"
                  initial={{ rotate: -90, transformOrigin: "50px 55px" }}
                  animate={{ rotate: -90 + (180 * Math.min(100, tauxMarge)) / 100, transformOrigin: "50px 55px" }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                />
                <circle cx="50" cy="55" r="2.5" fill="#0F172A" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                <motion.span
                  className="text-3xl font-bold text-foreground"
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, duration: 0.4 }}
                >
                  {tauxMarge}%
                </motion.span>
                <span className="text-[0.65rem] text-muted-foreground">{formatFCFAShort(margeTotale)}</span>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Barre empilée horizontale CA = coûts + marge */}
            <div>
              <p className="text-[0.65rem] uppercase text-muted-foreground font-medium mb-2">Composition du CA</p>
              <div className="h-6 rounded-full overflow-hidden flex shadow-inner bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center"
                  initial={{ width: 0 }} animate={{ width: `${tauxCoutAchat}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  style={{ minWidth: "0" }}
                >
                  {tauxCoutAchat > 12 && <span className="text-[0.55rem] text-white font-bold">{tauxCoutAchat}%</span>}
                </motion.div>
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center"
                  initial={{ width: 0 }} animate={{ width: `${tauxCoutEngrais}%` }}
                  transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
                  style={{ minWidth: "0" }}
                >
                  {tauxCoutEngrais > 8 && <span className="text-[0.55rem] text-white font-bold">{tauxCoutEngrais}%</span>}
                </motion.div>
                <motion.div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center"
                  initial={{ width: 0 }} animate={{ width: `${Math.max(0, 100 - tauxCoutAchat - tauxCoutEngrais)}%` }}
                  transition={{ duration: 1, delay: 0.9, ease: "easeOut" }}
                  style={{ minWidth: "0" }}
                >
                  {100 - tauxCoutAchat - tauxCoutEngrais > 8 && <span className="text-[0.55rem] text-white font-bold">{tauxMarge}%</span>}
                </motion.div>
              </div>
              <div className="flex justify-between text-[0.6rem] mt-1.5">
                <span className="text-red-600">Achat {formatFCFAShort(coutAchat)}</span>
                <span className="text-amber-600">Engrais {formatFCFAShort(coutEngraissement)}</span>
                <span className="text-emerald-600">Marge {formatFCFAShort(margeTotale)}</span>
              </div>
            </div>

            {/* Marge par tête highlight */}
            <motion.div
              className="mt-3 rounded-lg bg-gradient-to-r from-primary/10 to-emerald-50/40 border border-primary/20 p-2.5 text-center"
              initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 1 }}
            >
              <p className="text-[0.6rem] uppercase text-muted-foreground">Marge par tête</p>
              <p className="text-xl font-bold text-gradient tabular-nums">{formatFCFA(margeParTete)}</p>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// --- KPI rentabilité avec mini jauge circulaire ---
function RentabiliteKpi({
  icon: Icon, label, value, color, pct, hint, sub,
}: {
  icon: IconSvgElement; label: string; value: string; color: string; pct: number; hint?: string; sub?: string;
}) {
  const radius = 14;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="bg-white border border-border rounded-xl p-4 hover-lift relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 h-16 w-16 rounded-full blur-2xl opacity-20" style={{ background: color }} />
      <div className="flex items-start justify-between gap-2 relative">
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">{value}</p>
          {hint && <p className="text-[0.6rem] text-muted-foreground mt-0.5">{hint}</p>}
          {sub && <p className="text-[0.6rem] font-semibold mt-0.5" style={{ color }}>{sub}</p>}
        </div>
        {/* Mini jauge circulaire */}
        <div className="relative h-12 w-12 shrink-0">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r={radius} fill="none" stroke="oklch(0.94 0.01 80)" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r={radius} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              whileInView={{ strokeDashoffset: offset }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <HugeiconsIcon icon={Icon} size={16} style={{ color }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: IconSvgElement; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <HugeiconsIcon icon={Icon} size={16} className="text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {subtitle && <span className="text-[0.7rem] text-muted-foreground hidden sm:inline">— {subtitle}</span>}
    </div>
  );
}

// --- HERO KPI avec sparkline + tilt 3D + cube 3D ---
function HeroKpi({
  icon: Icon, label, value, suffix, formatter, color, trend, trendUp, hint, sparkData,
}: {
  icon: IconSvgElement; label: string; value: number; suffix?: string;
  formatter?: (n: number) => string; color: "emerald" | "teal" | "amber" | "red";
  trend?: string; trendUp?: boolean; hint?: string; sparkData: { v: number }[];
}) {
  const colors: Record<string, { bg: string; text: string; stroke: string; gradient: string; cube: string }> = {
    emerald: { bg: "from-emerald-500/10 to-emerald-500/5", text: "text-emerald-700", stroke: "#10B981", gradient: "gSparkE", cube: "#10B981" },
    teal: { bg: "from-teal-500/10 to-teal-500/5", text: "text-teal-700", stroke: "#14B8A6", gradient: "gSparkT", cube: "#14B8A6" },
    amber: { bg: "from-amber-500/10 to-amber-500/5", text: "text-amber-700", stroke: "#F59E0B", gradient: "gSparkA", cube: "#F59E0B" },
    red: { bg: "from-red-500/10 to-red-500/5", text: "text-red-700", stroke: "#EF4444", gradient: "gSparkR", cube: "#EF4444" },
  };
  const c = colors[color];

  // Parallaxe 3D au survol
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), { stiffness: 200, damping: 18 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 18 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      style={{ perspective: "800px" }}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <Card className={`bg-gradient-to-br ${c.bg} border-border hover-lift overflow-hidden relative`}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1" style={{ transform: "translateZ(30px)" }}>
                <p className="text-[0.65rem] uppercase tracking-wider font-medium text-muted-foreground truncate">{label}</p>
                <p className="text-2xl sm:text-3xl font-bold mt-1 text-foreground tabular-nums">
                  <AnimatedCounter value={value} format={formatter} duration={1.4} delay={0.1} />
                  {suffix && <span className="text-base font-medium text-muted-foreground ml-1">{suffix}</span>}
                </p>
                {trend && (
                  <div className="flex items-center gap-1 mt-1 text-[0.7rem] font-medium">
                    {trendUp ? <HugeiconsIcon icon={TrendingUp} size={12} className="text-emerald-600" /> : <HugeiconsIcon icon={Minus} size={12} className="text-muted-foreground" />}
                    <span className={trendUp ? "text-emerald-700" : "text-muted-foreground"}>{trend}</span>
                  </div>
                )}
                {hint && <p className="text-[0.65rem] text-muted-foreground mt-0.5">{hint}</p>}
              </div>
              {/* Cube 3D rotatif avec l'icône */}
              <motion.div
                className="relative shrink-0"
                style={{ width: 36, height: 36, transformStyle: "preserve-3d", transform: "translateZ(50px)" }}
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                {/* Face avant */}
                <div className="absolute inset-0 rounded-lg flex items-center justify-center shadow-md" style={{ background: `linear-gradient(135deg, ${c.cube}, ${c.cube}cc)`, transform: "translateZ(8px)" }}>
                  <HugeiconsIcon icon={Icon} size={18} className="text-white" />
                </div>
                {/* Face arrière */}
                <div className="absolute inset-0 rounded-lg" style={{ background: `${c.cube}99`, transform: "translateZ(-8px) rotateY(180deg)" }} />
                {/* Faces latérales */}
                <div className="absolute inset-0 rounded-lg" style={{ background: `${c.cube}cc`, transform: "rotateY(90deg) translateZ(8px)" }} />
                <div className="absolute inset-0 rounded-lg" style={{ background: `${c.cube}aa`, transform: "rotateY(-90deg) translateZ(8px)" }} />
              </motion.div>
            </div>
            {/* Sparkline */}
            <div className="h-10 mt-2 -mx-1" style={{ transform: "translateZ(15px)" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData}>
                  <defs>
                    <linearGradient id={c.gradient} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c.stroke} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={c.stroke} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area isAnimationActive animationDuration={1000} type="monotone" dataKey="v" stroke={c.stroke} strokeWidth={2} fill={`url(#${c.gradient})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// --- Mini stat avec icône ---
function MiniStat({ label, value, suffix, icon: Icon, accent, warning }: { label: string; value: string | number; suffix?: string; icon: IconSvgElement; accent?: boolean; warning?: boolean }) {
  return (
    <div className={`rounded-lg p-2.5 ${accent ? (warning ? "bg-amber-50 border border-amber-200" : "bg-primary/5 border border-primary/20") : "bg-muted/50"}`}>
      <HugeiconsIcon icon={Icon} size={14} className={`mx-auto mb-1 ${warning ? "text-amber-600" : "text-primary"}`} />
      <p className="text-base sm:text-lg font-bold text-foreground tabular-nums">{value}{suffix}</p>
      <p className="text-[0.6rem] uppercase text-muted-foreground truncate">{label}</p>
    </div>
  );
}

// --- Anneau d'échéance (SVG circulaire) ---
function EcheanceRing({ count, total, label, color }: { count: number; total: number; label: string; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r={radius} fill="none" stroke="oklch(0.94 0.01 80)" strokeWidth="6" />
          <motion.circle
            cx="35" cy="35" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-foreground">{count}</span>
        </div>
      </div>
      <p className="text-[0.65rem] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <ViewHeader title="Tableau de bord" description="Chargement des données..." icon={Activity} />
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

// === COMPARAISON DE PÉRIODES ===
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
        {metrics.map((m, i) => {
          const d = m.val.delta;
          const good = m.isGood(d.pct);
          const curVal = m.isCount ? String(m.val.courant) : formatFCFAShort(m.val.courant);
          return (
            <motion.div
              key={m.key}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="bg-white border border-border rounded-xl p-4 hover-lift"
            >
              <p className="text-[0.65rem] uppercase text-muted-foreground font-medium">{m.label}</p>
              <p className="text-xl font-bold text-foreground tabular-nums mt-1">{curVal}</p>
              <div className="flex items-center gap-1 mt-1.5 text-[0.7rem] font-medium">
                {d.pct > 0 ? <HugeiconsIcon icon={TrendingUp} size={12} /> : d.pct < 0 ? <HugeiconsIcon icon={TrendingDown} size={12} /> : <HugeiconsIcon icon={Minus} size={12} />}
                <span className={good ? "text-emerald-600" : "text-red-600"}>
                  {d.pct === 0 ? "stable" : `${d.pct > 0 ? "+" : ""}${d.pct}%`}
                </span>
              </div>
            </motion.div>
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
        <div className="lg:col-span-1 space-y-3">
          <p className="text-[0.65rem] uppercase text-muted-foreground font-medium">Top performers</p>
          {top3.map((r, i) => (
            <motion.div
              key={r.race}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className={`rounded-xl border p-3 ${i === 0 ? "border-amber-200 bg-gradient-to-br from-amber-50/60 to-amber-50/20" : "border-border bg-white"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[0.65rem] font-bold ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : "bg-orange-300 text-white"}`}>{i + 1}</span>
                  <span className="text-sm font-semibold">{r.race}</span>
                </div>
                {i === 0 && <HugeiconsIcon icon={Trophy} size={16} className="text-amber-500" />}
              </div>
              <div className="flex justify-between mt-2 text-[0.7rem] text-muted-foreground">
                <span>{r.total} bovins ({r.vendus} vendus)</span>
                <span className="font-semibold text-emerald-600">{formatFCFAShort(r.margeMoyenne)}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-white border border-border rounded-xl p-4">
          <p className="text-[0.65rem] uppercase text-muted-foreground font-medium mb-3">Marge moyenne par race (FCFA)</p>
          <div className="space-y-3">
            {races.map((r, i) => (
              <div key={r.race} className="flex items-center gap-3">
                <span className="text-xs font-medium w-28 truncate">{r.race}</span>
                <div className="flex-1 h-6 bg-muted rounded-md overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(r.margeMoyenne / maxMarge) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-md"
                  />
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
