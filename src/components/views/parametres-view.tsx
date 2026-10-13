"use client";
import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewHeader } from "./_shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useUpdateParam } from "@/lib/api";
import { Settings, Check } from "@/lib/icons";
import { toast } from "sonner";

export function ParametresView() {
  const { data: params, isLoading } = useParams();
  const updateParam = useUpdateParam();
  const [values, setValues] = useState<Record<string, string>>({});
  const list = params ?? [];

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const v: Record<string, string> = {}; list.forEach((p) => { v[p.cle] = p.valeur; }); setValues(v); }, [list]);

  return (
    <div className="space-y-6">
      <ViewHeader title="Paramètres & seuils" description="Configurez les seuils d'alerte" icon={Settings} />
      {isLoading ? <Skeleton className="h-48" /> : (
        <Card><CardHeader><CardTitle className="text-sm">Seuils d'alerte</CardTitle><CardDescription className="text-xs">Ajustez les seuils déclenchant les alertes</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {list.map((p) => (<div key={p.id} className="flex items-center gap-3 border-b pb-3 last:border-0">
              <div className="flex-1"><p className="text-sm font-medium">{p.description ?? p.cle}</p></div>
              <Input value={values[p.cle] ?? ""} onChange={(e) => setValues({ ...values, [p.cle]: e.target.value })} className="w-32 h-8 text-sm" />
              <Button size="sm" variant="ghost" onClick={() => updateParam.mutate({ cle: p.cle, valeur: values[p.cle] ?? "" }, { onSuccess: () => toast.success("Paramètre mis à jour") })}><HugeiconsIcon icon={Check} size={16} /></Button>
            </div>))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
