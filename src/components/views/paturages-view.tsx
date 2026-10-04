"use client";
import { ViewHeader, KpiCard } from "./_shared";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaturages } from "@/lib/api";
import { Map, MapPin } from "@/lib/icons";

export function PaturagesView() {
  const { data: paturages, isLoading } = usePaturages();
  const list = paturages ?? [];
  const surfaceTotale = list.reduce((s, p) => s + p.surface, 0);
  const capaciteTotal = list.reduce((s, p) => s + p.capacite, 0);

  return (
    <div className="space-y-6">
      <ViewHeader title="Pâturages" description="Géolocalisation et gestion des parcelles" icon={Map} />
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Parcelles" value={list.length} icon={Map} variant="primary" />
        <KpiCard label="Surface totale" value={`${surfaceTotale.toFixed(1)} ha`} icon={Map} />
        <KpiCard label="Capacité totale" value={`${capaciteTotal} bovins`} icon={Map} variant="success" />
      </div>
      <Card><CardContent className="p-4">
        {isLoading ? <Skeleton className="h-48" /> : list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Aucun pâturage enregistré.</p> : (
          <div className="relative h-[300px] bg-muted/30 rounded-xl border border-border overflow-hidden">
            {list.map((p, i) => (
              <div key={p.id} className="absolute border-2 border-primary/30 bg-primary/10 rounded-lg p-3 cursor-pointer hover:border-primary/60 hover:shadow-md transition-all"
                style={{ top: `${(i % 3) * 30 + 10}%`, left: `${(i * 25 + 5) % 70}%`, width: `${20 + p.surface * 3}%`, minHeight: 80 }}>
                <div className="flex items-center gap-1.5"><HugeiconsIcon icon={MapPin} size={12} className=".5 .5 text-primary" /><p className="text-xs font-semibold text-foreground">{p.nom}</p></div>
                <p className="text-[0.65rem] text-muted-foreground mt-1">{p.surface} ha · {p.capacite} bovins</p>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>
      {list.length > 0 && (<Card><CardContent className="p-0">
        <table className="w-full text-sm"><thead className="bg-muted/80"><tr className="text-left"><th className="p-3">Parcelle</th><th className="p-3 text-right">Surface (ha)</th><th className="p-3 text-right">Capacité</th></tr></thead>
        <tbody>{list.map((p) => (<tr key={p.id} className="border-t"><td className="p-3"><div className="flex items-center gap-2"><HugeiconsIcon icon={MapPin} size={12} className=".5 .5 text-primary" />{p.nom}</div></td><td className="p-3 text-right tabular-nums">{p.surface}</td><td className="p-3 text-right tabular-nums">{p.capacite} bovins</td></tr>))}</tbody>
        </table>
      </CardContent></Card>)}
    </div>
  );
}
