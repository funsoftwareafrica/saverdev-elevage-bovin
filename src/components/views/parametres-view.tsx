"use client";
import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewHeader, KpiCard } from "./_shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackups, useCreateBackup, useParams, useUpdateParam } from "@/lib/api";
import { Settings, Check, Info, Database, Download, HardDrive, Clock } from "@/lib/icons";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import type { Backup } from "@/lib/types";

export function ParametresView() {
  const { data: params, isLoading } = useParams();
  const updateParam = useUpdateParam();
  const { data: backups } = useBackups();
  const createBackup = useCreateBackup();
  const [values, setValues] = useState<Record<string, string>>({});
  const list = params ?? [];
  const backupList = backups ?? [];

  useEffect(() => { const v: Record<string, string> = {}; list.forEach((p) => { v[p.cle] = p.valeur; }); setValues(v); }, [list]);

  return (
    <div className="space-y-6">
      <ViewHeader title="Paramètres & seuils" description="Configurez les seuils d'alerte + sauvegardes" icon={Settings} />
      {isLoading ? <Skeleton className="h-48" /> : (
        <Card><CardHeader><CardTitle className="text-sm">Seuils d'alerte</CardTitle><CardDescription className="text-xs">Ajustez les seuils déclenchant les alertes</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {list.map((p) => (<div key={p.id} className="flex items-center gap-3 border-b pb-3 last:border-0">
              <div className="flex-1"><p className="text-sm font-medium">{p.description ?? p.cle}</p></div>
              <Input value={values[p.cle] ?? ""} onChange={(e) => setValues({ ...values, [p.cle]: e.target.value })} className="w-32 h-8 text-sm" />
              <Button size="sm" variant="ghost" onClick={() => updateParam.mutate({ cle: p.cle, valeur: values[p.cle] ?? "" }, { onSuccess: () => toast.success("Paramètre mis à jour") })}><HugeiconsIcon icon={Check} size={4} /></Button>
            </div>))}
          </CardContent>
        </Card>
      )}
      {/* Sauvegardes */}
      <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><HugeiconsIcon icon={Database} size={4} className="text-primary" /> Sauvegardes</CardTitle><CardDescription className="text-xs">Sauvegarde quotidienne auto + manuelle</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => createBackup.mutate(undefined, { onSuccess: () => toast.success("Sauvegarde créée") })} disabled={createBackup.isPending} className="bg-primary"><HugeiconsIcon icon={Database} size={4} /> {createBackup.isPending ? "En cours..." : "Sauvegarder maintenant"}</Button>
          {backupList.length > 0 && (<div className="border rounded-lg divide-y max-h-48 overflow-auto scroll-thin">
            {backupList.slice(0, 10).map((b: Backup) => (<div key={b.id} className="flex items-center justify-between px-3 py-2">
              <div><p className="text-xs font-medium">{b.filename}</p><p className="text-[0.65rem] text-muted-foreground">{formatDate(b.date)} · {b.size} o · {b.entities} ent.</p></div>
              <Badge variant="outline" className="text-[0.6rem]">{b.type === "auto" ? "Auto" : "Manuelle"}</Badge>
            </div>))}
          </div>)}
        </CardContent>
      </Card>
    </div>
  );
}
