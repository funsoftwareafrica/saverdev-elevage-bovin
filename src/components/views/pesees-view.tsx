"use client";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewHeader, KpiCard } from "./_shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePesees, useCreatePese, useBovins } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { Scale, Plus } from "@/lib/icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function PeseesView() {
  const { data: pesees, isLoading } = usePesees();
  const { data: bovins } = useBovins();
  const createPese = useCreatePese();
  const [open, setOpen] = useState(false);
  const list = pesees ?? [];
  const actifs = (bovins ?? []).filter((b) => b.statut === "EN_ENGRAISSEMENT");
  const poidsMoyen = list.length ? list.reduce((s, p) => s + p.poids, 0) / list.length : 0;
  const distinctBovins = new Set(list.map((p) => p.bovinId)).size;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createPese.mutate({ bovinId: String(fd.get("bovinId")), poids: Number(fd.get("poids")), methode: String(fd.get("methode") || "Manuelle") },
      { onSuccess: () => { toast.success("Pesée enregistrée"); setOpen(false); }, onError: () => toast.error("Échec") } );
  };

  return (
    <div className="space-y-6">
      <ViewHeader title="Pesées connectées" description="Suivi du poids par bovin — manuel ou balance connectée" icon={Scale}
        action={<Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button size="sm" className="bg-primary"><HugeiconsIcon icon={Plus} size={4} /> Nouvelle pesée</Button></DialogTrigger>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Nouvelle pesée</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Bovin</Label><select name="bovinId" required className="w-full h-9 rounded-md border px-3 text-sm">{actifs.map((b) => <option key={b.id} value={b.id}>{b.identifiant} — {b.race}</option>)}</select></div>
          <div className="space-y-1.5"><Label className="text-xs">Poids (kg)</Label><Input name="poids" type="number" placeholder="320" required /></div>
          <div className="space-y-1.5"><Label className="text-xs">Méthode</Label><select name="methode" className="w-full h-9 rounded-md border px-3 text-sm"><option>Manuelle</option><option>Balance connectée</option><option>Estimée</option></select></div>
          <DialogFooter><Button type="submit" size="sm" className="bg-primary">Enregistrer</Button></DialogFooter>
        </form></DialogContent></Dialog>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Pesées" value={list.length} icon={Scale} variant="primary" />
        <KpiCard label="Poids moyen" value={`${Math.round(poidsMoyen)} kg`} icon={Scale} />
        <KpiCard label="Bovins pesés" value={distinctBovins} icon={Scale} variant="success" />
      </div>
      <Card><CardContent className="p-0">
        {isLoading ? <Skeleton className="h-48" /> : list.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Aucune pesée enregistrée.</p> : (
        <div className="max-h-[55vh] overflow-auto scroll-thin"><table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80"><tr className="text-left"><th className="p-3">Date</th><th className="p-3">Bovin</th><th className="p-3">Race</th><th className="p-3 text-right">Poids</th><th className="p-3">Méthode</th></tr></thead>
          <tbody>{list.map((p) => (<tr key={p.id} className="border-t"><td className="p-3 text-xs">{formatDate(p.date)}</td><td className="p-3 font-mono font-semibold text-primary">{p.identifiant}</td><td className="p-3">{p.race}</td><td className="p-3 text-right tabular-nums font-bold text-primary">{p.poids} kg</td><td className="p-3"><Badge variant="outline" className="text-[0.65rem]">{p.methode}</Badge></td></tr>))}</tbody>
        </table></div>
        )}
      </CardContent></Card>
    </div>
  );
}
