"use client";
import { ViewHeader, KpiCard } from "./_shared";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTresorerie } from "@/lib/api";
import { formatFCFA, formatFCFAShort } from "@/lib/format";
import { Wallet, AlertTriangle, Receipt, Check } from "@/lib/icons";

export function TresorerieView() {
  const { data: t, isLoading } = useTresorerie();
  if (isLoading || !t) return <div className="space-y-6"><ViewHeader title="Prévisions de trésorerie" description="Chargement..." icon={Wallet} /><Skeleton className="h-64" /></div>;
  return (
    <div className="space-y-6">
      <ViewHeader title="Prévisions de trésorerie" description="Projection sur 6 mois — encaissements, décaissements, mois à risque" icon={Wallet} />
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Solde initial" value={formatFCFAShort(t.soldeInitial)} variant="success" icon={Wallet} />
        <KpiCard label="Mois à risque" value={t.moisARisque} variant={t.moisARisque > 0 ? "danger" : "default"} icon={AlertTriangle} />
        <KpiCard label="Dépense mensuelle moy." value={formatFCFA(t.depenseMensuelleMoy)} variant="warning" icon={Receipt} />
      </div>
      <Card><CardContent className="p-4">
        <p className="text-sm font-semibold mb-3">Détail mois par mois</p>
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead><tr className="text-left border-b"><th className="p-2">Mois</th><th className="p-2 text-right">Entrées</th><th className="p-2 text-right">Sorties</th><th className="p-2 text-right">Solde net</th><th className="p-2 text-right">Cumulé</th><th className="p-2 text-center">État</th></tr></thead>
          <tbody>{t.projection.map((m, i) => (
            <tr key={i} className={`border-b ${m.enRisque ? "bg-red-50" : ""}`}>
              <td className="p-2 font-medium">{m.mois}</td>
              <td className="p-2 text-right tabular-nums text-emerald-600">{formatFCFA(m.entrees, false)}</td>
              <td className="p-2 text-right tabular-nums text-red-600">{formatFCFA(m.sorties, false)}</td>
              <td className={`p-2 text-right tabular-nums font-medium ${m.solde >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatFCFA(m.solde, false)}</td>
              <td className={`p-2 text-right tabular-nums font-bold ${m.soldeCumule >= 0 ? "text-foreground" : "text-red-700"}`}>{formatFCFA(m.soldeCumule, false)}</td>
              <td className="p-2 text-center">{m.enRisque ? <span className="inline-flex items-center gap-1 text-red-600 font-medium"><HugeiconsIcon icon={AlertTriangle} size={12} /> Risque</span> : <HugeiconsIcon icon={Check} size={12} className="inline text-emerald-600" />}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </CardContent></Card>
    </div>
  );
}
