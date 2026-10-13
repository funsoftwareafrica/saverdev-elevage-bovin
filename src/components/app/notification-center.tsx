"use client";

// NotificationCenter — cloche dans le header + popover avec liste + boutons.
//
// Au montage, déclenche /api/notifications/check pour générer les alertes
// manquantes (échéances J-7/J-1, stock bas, dépenses > 500k, mortalité).

import { useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bell, Check, CheckCircle2, AlertTriangle, AlertCircle, Info } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, useMarkAllNotificationsRead, useCheckNotifications } from "@/lib/api";
import { useRealtimeNotifications } from "@/lib/realtime";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { IconSvgElement } from "@hugeicons/react";

const TYPE_ICON: Record<string, IconSvgElement> = {
  ECHEANCE: AlertTriangle,
  BUDGET: AlertCircle,
  MORTALITE: AlertCircle,
  STOCK: AlertCircle,
  MARGE: AlertCircle,
  VALIDATION: Info,
  AUTRE: Info,
  INFO: Info,
  WARNING: AlertTriangle,
  CRITICAL: AlertCircle,
};

function typeColor(t: string, titre: string): string {
  const isCrit = titre.toLowerCase().includes("critique") || titre.toLowerCase().includes("mortalité");
  const isWarn = titre.toLowerCase().includes("attente") || titre.toLowerCase().includes("bas") || titre.toLowerCase().includes("demain") || titre.toLowerCase().includes("élevé");
  if (isCrit) return "bg-red-100 text-red-700 border-red-200";
  if (isWarn) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-sky-100 text-sky-700 border-sky-200";
}

export function NotificationCenter() {
  const { data, isLoading } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const check = useCheckNotifications();
  const checkedRef = useRef(false);

  // Connexion WebSocket temps réel — invalidate la query ["notifications"]
  // quand le backend émet un event "notification:new".
  useRealtimeNotifications();

  // Au premier mount, déclenche la génération auto des notifications.
  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    check.mutate(undefined, {
      onSuccess: (res: { created?: number }) => {
        if (res?.created && res.created > 0) {
          toast.info(`${res.created} nouvelle(s) notification(s)`);
        }
      },
      onError: () => {/* silent */},
    });
  }, [check]);

  const items = data?.items ?? [];
  const nonLues = data?.nonLues ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label="Notifications"
        >
          <HugeiconsIcon icon={Bell} size={18} />
          {nonLues > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[0.6rem] font-bold flex items-center justify-center"
              title={`${nonLues} notification(s) non lue(s)`}
            >
              {nonLues > 9 ? "9+" : nonLues}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Bell} size={16} className="text-primary" />
            <span className="text-sm font-semibold">Notifications</span>
            {nonLues > 0 && (
              <Badge variant="outline" className="text-[0.6rem] text-red-700 border-red-200 bg-red-50">
                {nonLues} non lue(s)
              </Badge>
            )}
          </div>
          {nonLues > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={markAll.isPending}
              onClick={() =>
                markAll.mutate(undefined, {
                  onSuccess: () => toast.success("Toutes les notifications marquées comme lues"),
                })
              }
            >
              <HugeiconsIcon icon={Check} size={14} /> Tout marquer lu
            </Button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-auto scroll-thin">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <HugeiconsIcon icon={CheckCircle2} size={28} className="text-emerald-600" />
              <p>Aucune notification.</p>
              <p className="text-[0.65rem]">Les alertes (échéances, stock, budget) apparaîtront ici.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Info;
                return (
                  <li
                    key={`${n.source ?? "notif"}-${n.id}`}
                    className={cn(
                      "p-3 hover:bg-muted/40 transition-colors cursor-default",
                      !n.lu && "bg-primary/[0.03]"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn("h-8 w-8 shrink-0 rounded-md flex items-center justify-center border", typeColor(n.type, n.titre))}>
                        <HugeiconsIcon icon={Icon} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold truncate">{n.titre}</p>
                          {!n.lu && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" aria-label="Non lue" />}
                        </div>
                        <p className="text-[0.7rem] text-muted-foreground mt-0.5 line-clamp-3">{n.message}</p>
                        <p className="text-[0.6rem] text-muted-foreground mt-1">{formatDate(n.date)}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
