"use client";

// Vue Rentabilité — analyse des marges, ventilation des coûts, tendances.

import { useMemo } from "react";
import { MOCK_BOVINS, computeBovinMarge, computeDashboard } from "@/lib/mock-data";
import { formatFCFA, formatFCFAShort, formatDate, CHART_COLORS } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, ShoppingCart, Beef, Salad, PiggyBank, Activity, Percent } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ViewHeader, KpiCard } from "./_shared";

export function RentabiliteView() {
  const dash = useMemo(() => computeDashboard(), []);
  const vendus = MOCK_BOVINS.filter((b) => b.statut === "VENDU");

  const totalCoutRevient = vendus.reduce((s, b) => s + computeBovinMarge(b).coutRevient, 0);
  const margeTotale = dash.rentabilite.margeTotale;
  const tauxMarge = dash.rentabilite.ca > 0 ? (margeTotale / dash.rentabilite.ca) * 100 : 0;

  // Ventilation des coûts pour le pie chart
  const repartitionCouts = [
    { name: "Achat bovins", value: dash.rentabilite.coutAchat, fill: CHART_COLORS.marronTerre },
    { name: "Alimentation", value: vendus.reduce((s, b) => s + b.coutsEngraissement, 0), fill: CHART_COLORS.vertClair },
    { name: "Autres coûts", value: vendus.reduce((s, b) => s + b.autresCouts, 0), fill: CHART_COLORS.bleuCiel },
  ];
  const totalCouts = repartitionCouts.reduce((s, c) => s + c.value, 0);

  // Marges par bovin vendu pour bar chart
  const margesParBovin = vendus.map((b) => {
    const { marge } = computeBovinMarge(b);
    return { identifiant: b.identifiant, marge: marge ?? 0 };
  });

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Rentabilité"
        description="Analyse des marges par tête, ventilation des coûts et tendances."
        icon={TrendingUp}
      />

      {/* KPI principaux */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Chiffre d'affaires" value={formatFCFA(dash.rentabilite.ca)} icon={ShoppingCart} variant="success" hint={`${vendus.length} bovin(s) vendu(s)`} />
        <KpiCard label="Coût d'achat total" value={formatFCFA(dash.rentabilite.coutAchat)} icon={Beef} />
        <KpiCard label="Coûts d'engraissement" value={formatFCFA(dash.rentabilite.coutEngraissement)} icon={Salad} />
        <KpiCard
          label="Marge totale"
          value={formatFCFA(margeTotale)}
          icon={margeTotale >= 0 ? TrendingUp : TrendingDown}
          variant={margeTotale >= 0 ? "success" : "danger"}
          hint={`Taux de marge : ${tauxMarge.toFixed(1)}%`}
        />
      </div>

      {/* Détail marge par tête */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-primary" /> Synthèse marge par tête
            </CardTitle>
            <CardDescription className="text-xs">Calcul : prix de vente – coût de revient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[0.65rem] uppercase text-muted-foreground">Marge moyenne</p>
                <p className="text-xl font-bold text-primary tabular-nums">{formatFCFA(dash.rentabilite.margeParTete, false)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[0.65rem] uppercase text-muted-foreground">Taux de marge</p>
                <p className="text-xl font-bold text-primary tabular-nums">{tauxMarge.toFixed(1)}%</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Prix de vente moyen</span><span className="tabular-nums">{formatFCFA(dash.rentabilite.ca / Math.max(1, vendus.length))}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Coût de revient moyen</span><span className="tabular-nums">{formatFCFA(totalCoutRevient / Math.max(1, vendus.length))}</span></div>
              <div className="flex justify-between text-sm font-medium pt-2 border-t"><span>Marge moyenne par tête</span><span className="tabular-nums text-emerald-700">{formatFCFA(dash.rentabilite.margeParTete)}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Ventilation des coûts (pie) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ventilation des coûts</CardTitle>
            <CardDescription className="text-xs">Répartition par poste (total : {formatFCFA(totalCouts)})</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={repartitionCouts}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={40}
                  paddingAngle={2}
                  label={(e) => `${((e.value / totalCouts) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {repartitionCouts.map((s, i) => <Cell key={i} fill={s.fill} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Marges par bovin (bar chart) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Marges par bovin vendu</CardTitle>
          <CardDescription className="text-xs">Comparaison des marges réalisées (FCFA)</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={margesParBovin} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.015 80)" />
              <XAxis dataKey="identifiant" tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 50)" />
              <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.55 0.02 50)" tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")} />
              <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
              <Bar dataKey="marge" name="Marge" radius={[4, 4, 0, 0]}>
                {margesParBovin.map((entry, i) => (
                  <Cell key={i} fill={entry.marge >= 0 ? CHART_COLORS.vertForet : CHART_COLORS.rougeTerre} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Détail des ventes et marges</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[40vh] overflow-auto scroll-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="text-left">
                  <th className="p-3 font-medium">Bovin</th>
                  <th className="p-3 font-medium hidden sm:table-cell">Vente</th>
                  <th className="p-3 font-medium text-right">Prix vente</th>
                  <th className="p-3 font-medium text-right hidden md:table-cell">Coût revient</th>
                  <th className="p-3 font-medium text-right">Marge</th>
                  <th className="p-3 font-medium text-center">%</th>
                </tr>
              </thead>
              <tbody>
                {vendus.map((b) => {
                  const { coutRevient, marge } = computeBovinMarge(b);
                  const pct = coutRevient > 0 ? ((marge ?? 0) / coutRevient) * 100 : 0;
                  return (
                    <tr key={b.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-mono font-semibold text-primary">{b.identifiant}</td>
                      <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell">{formatDate(b.dateVente)}</td>
                      <td className="p-3 text-right tabular-nums">{formatFCFA(b.prixVente, false)}</td>
                      <td className="p-3 text-right tabular-nums hidden md:table-cell text-muted-foreground">{formatFCFA(coutRevient, false)}</td>
                      <td className={`p-3 text-right tabular-nums font-medium ${marge !== null && marge >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {marge !== null ? formatFCFA(marge, false) : "—"}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs font-semibold ${pct >= 0 ? "text-emerald-700" : "text-red-700"}`}>{pct.toFixed(0)}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
