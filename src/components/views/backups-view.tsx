"use client";

// Vue Sauvegardes — backups manuels & automatiques (évolution 8).
//
// Fonctionnalités :
//   - Liste des sauvegardes (date, type, taille, nb entités)
//   - Déclenchement d'un backup manuel (POST /api/backup)
//   - Vérification auto au montage (GET /api/backup/auto) → crée un backup
//     si le dernier date de +7 jours
//   - Téléchargement du fichier JSON (GET /api/backup/[id]/download)
//
// Réservé au rôle E2A (SINERGI en lecture seule).

import { useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useBackups, useCreateBackup, useCheckAutoBackup } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { formatDate, formatBytes } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Download, Plus, HardDrive, CheckCircle2, Clock } from "@/lib/icons";
import { ViewHeader, KpiCard } from "./_shared";
import { toast } from "sonner";
import type { Backup } from "@/lib/types";

export function BackupsView() {
  const role = useAppStore((s) => s.role);
  const readOnly = role !== "E2A";
  const { data: backups, isLoading } = useBackups();
  const createBackup = useCreateBackup();
  const checkAuto = useCheckAutoBackup();
  const autoChecked = useRef(false);

  // Au montage, déclenche la vérification auto (crée un backup si +7 jours)
  useEffect(() => {
    if (autoChecked.current) return;
    autoChecked.current = true;
    checkAuto.mutate(undefined, {
      onSuccess: (res) => {
        if (res?.created && res.backup) {
          toast.success("Sauvegarde automatique créée", {
            description: `Dernier backup datait de +7 jours — nouveau backup généré`,
          });
        }
      },
      onError: () => {/* silent */},
    });
  }, [checkAuto]);

  const list = backups ?? [];
  const lastBackup = list[0];
  const manualCount = list.filter((b) => b.type === "manual").length;
  const autoCount = list.filter((b) => b.type === "auto").length;
  const totalSize = list.reduce((s, b) => s + b.size, 0);
  const totalEntities = list.reduce((s, b) => s + b.entities, 0);

  const handleCreate = () => {
    createBackup.mutate(undefined, {
      onSuccess: (res: Backup) => {
        toast.success("Sauvegarde manuelle créée", {
          description: `${res.filename} · ${formatBytes(res.size)} · ${res.entities} entités`,
        });
      },
      onError: () => toast.error("Échec de la sauvegarde manuelle"),
    });
  };

  const handleDownload = (b: Backup) => {
    const a = document.createElement("a");
    a.href = `/api/backup/${b.id}/download`;
    a.download = b.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Téléchargement démarré", { description: b.filename });
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Sauvegardes"
        description="Sauvegardes automatiques (hebdo) et manuelles de la base — export JSON complet."
        icon={Database}
        action={
          !readOnly && (
            <Button size="sm" className="bg-primary" onClick={handleCreate} disabled={createBackup.isPending}>
              <HugeiconsIcon icon={Plus} size={16} /> Nouvelle sauvegarde
            </Button>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Sauvegardes" value={list.length} icon={Database} variant="primary" hint="Total cumulé" />
        <KpiCard label="Manuelles" value={manualCount} icon={HardDrive} hint="Déclenchées par E2A" />
        <KpiCard label="Automatiques" value={autoCount} icon={Clock} hint=" Hebdomadaires (J+7)" />
        <KpiCard label="Taille totale" value={formatBytes(totalSize)} icon={Database} hint={`${totalEntities} entités cumulées`} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm">Historique des sauvegardes</CardTitle>
            <CardDescription className="text-xs">
              {lastBackup
                ? `Dernier backup : ${formatDate(lastBackup.date)} · prochaine sauvegarde auto dans 7 jours`
                : "Aucune sauvegarde enregistrée"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[55vh] overflow-auto scroll-thin">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur">
                <TableRow>
                  <TableHead className="w-[80px]">Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Fichier</TableHead>
                  <TableHead className="text-right">Taille</TableHead>
                  <TableHead className="text-right">Entités</TableHead>
                  <TableHead className="w-[80px] text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      <HugeiconsIcon icon={Database} size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                      Aucune sauvegarde enregistrée.
                      {!readOnly && " Cliquez sur « Nouvelle sauvegarde » pour en créer une."}
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((b) => (
                    <TableRow key={b.id} className="hover:bg-muted/40">
                      <TableCell>
                        {b.type === "auto" ? (
                          <Badge variant="outline" className="text-[0.6rem] text-sky-700 border-sky-200 bg-sky-50">
                            <HugeiconsIcon icon={Clock} size={10} className="mr-1" /> Auto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[0.6rem] text-emerald-700 border-emerald-200 bg-emerald-50">
                            <HugeiconsIcon icon={HardDrive} size={10} className="mr-1" /> Manuel
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(b.date)}</TableCell>
                      <TableCell className="text-xs font-mono truncate max-w-[280px]">{b.filename}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{formatBytes(b.size)}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{b.entities}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Télécharger le JSON"
                          onClick={() => handleDownload(b)}
                        >
                          <HugeiconsIcon icon={Download} size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/[0.03]">
        <CardContent className="p-4 flex items-start gap-3">
          <HugeiconsIcon icon={CheckCircle2} size={20} className="text-primary shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-foreground">Sauvegarde automatique hebdomadaire</p>
            <p className="text-muted-foreground">
              Au montage de cette vue, l'application vérifie automatiquement la date du dernier backup.
              Si celui-ci date de plus de <strong>7 jours</strong>, une nouvelle sauvegarde est créée
              (export JSON complet : bovins, alimentations, dépenses, ventes, financements, échéances,
              alertes, historique, paramètres, soins, validations, etc.).
            </p>
            <p className="text-muted-foreground">
              Les fichiers sont stockés dans le dossier <code className="text-[0.65rem] bg-muted px-1 py-0.5 rounded">/backups</code> à la racine du projet et référencés en base (table <strong>Backup</strong>).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
