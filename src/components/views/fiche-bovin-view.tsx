"use client";

// Vue Fiche bovin — détail complet d'un bovin (identification, achat, coûts, marge).

import { useMemo } from "react";
import { MOCK_BOVINS, computeBovinMarge } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";
import { formatFCFA, formatDate, statutBovinColor, joursEntre } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Beef, ShoppingCart, Salad, Wallet, TrendingUp, Calendar, Scale, User } from "lucide-react";

export function FicheBovinView() {
  const selectedBovinId = useAppStore((s) => s.selectedBovinId);
  const setView = useAppStore((s) => s.setView);

  const bovin = useMemo(
    () => MOCK_BOVINS.find((b) => b.id === selectedBovinId) ?? MOCK_BOVINS[0],
    [selectedBovinId]
  );

  const { coutRevient, marge } = computeBovinMarge(bovin);
  const margePct = coutRevient > 0 && marge !== null ? (marge / coutRevient) * 100 : 0;
  const dureeJours = joursEntre(bovin.dateAchat, bovin.dateVente);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setView("bovins")} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour à la liste
        </Button>
      </div>

      {/* En-tête fiche */}
      <Card className="border-primary/30 bg-primary/[0.03]">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Beef className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold font-mono text-primary">{bovin.identifiant}</h2>
                  <Badge variant="outline" className={`text-[0.65rem] ${statutBovinColor(bovin.statut)}`}>
                    {bovin.statut === "EN_ENGRAISSEMENT" ? "En engraissement" : bovin.statut === "VENDU" ? "Vendu" : "Mort"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {bovin.race} · {bovin.sexe} · {bovin.poidsAchat} kg à l'achat
                </p>
              </div>
            </div>
            {bovin.statut === "VENDU" && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Marge réalisée</p>
                <p className={`text-2xl font-bold tabular-nums ${marge !== null && marge >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {marge !== null ? formatFCFA(marge) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{margePct.toFixed(1)}% du coût de revient</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Beef} label="Race" value={bovin.race} />
            <Row icon={User} label="Sexe" value={bovin.sexe} />
            <Row icon={Scale} label="Poids à l'achat" value={`${bovin.poidsAchat} kg`} />
            <Separator />
            <Row icon={Calendar} label="Date d'achat" value={formatDate(bovin.dateAchat)} />
            <Row icon={Beef} label="Durée en cycle" value={`${dureeJours} jours`} />
            {bovin.dateVente && <Row icon={Calendar} label="Date de vente" value={formatDate(bovin.dateVente)} />}
            {bovin.clientVente && <Row icon={User} label="Client" value={bovin.clientVente} />}
          </CardContent>
        </Card>

        {/* Coûts & marge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Coûts & marge
            </CardTitle>
            <CardDescription className="text-xs">Calcul automatique du coût de revient</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CostRow icon={ShoppingCart} label="Prix d'achat" value={bovin.prixAchat} />
            <CostRow icon={Salad} label="Coûts d'engraissement" value={bovin.coutsEngraissement} />
            <CostRow icon={Wallet} label="Autres coûts imputés" value={bovin.autresCouts} />
            <Separator />
            <div className="flex justify-between font-semibold text-sm">
              <span>Coût de revient</span>
              <span className="tabular-nums text-primary">{formatFCFA(coutRevient)}</span>
            </div>
            {bovin.statut === "VENDU" && (
              <>
                <CostRow icon={TrendingUp} label="Prix de vente" value={bovin.prixVente} />
                <Separator />
                <div className="flex justify-between font-semibold text-sm">
                  <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Marge</span>
                  <span className={`tabular-nums ${marge !== null && marge >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {marge !== null ? formatFCFA(marge) : "—"}
                  </span>
                </div>
                {coutRevient > 0 && (
                  <div className="space-y-1">
                    <Progress value={Math.max(0, margePct)} className="h-2" />
                    <p className="text-[0.7rem] text-muted-foreground text-right">{margePct.toFixed(1)}% du coût de revient</p>
                  </div>
                )}
              </>
            )}
            {bovin.statut === "EN_ENGRAISSEMENT" && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                Bovin en cours d'engraissement — la marge sera calculée à la vente.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function CostRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="tabular-nums">{formatFCFA(value)}</span>
    </div>
  );
}
