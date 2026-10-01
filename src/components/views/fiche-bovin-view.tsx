"use client";

// Vue Fiche bovin — détail complet d'un bovin (identification, achat, coûts, marge).

import { useBovin } from "@/lib/api";
import { computeBovinMarge } from "@/lib/calculations";
import { useAppStore } from "@/lib/store";
import { formatFCFA, formatDate, statutBovinColor, joursEntre } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Beef, ShoppingCart, Salad, Wallet, TrendingUp, Calendar, Scale, User, QrCode, Printer } from "lucide-react";
import { QRCode } from "@/components/charts/qr-code";

export function FicheBovinView() {
  const selectedBovinId = useAppStore((s) => s.selectedBovinId);
  const setView = useAppStore((s) => s.setView);
  const { data: bovin, isLoading } = useBovin(selectedBovinId);

  if (isLoading || !bovin) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setView("bovins")} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour à la liste
        </Button>
        <Skeleton className="h-32 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

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

        {/* QR Code + impression étiquette */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" /> QR Code & étiquette
            </CardTitle>
            <CardDescription className="text-xs">Scannez pour accéder à la fiche mobile</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 py-4">
            <QRCode value={bovin.identifiant} size={140} className="rounded-lg border border-border p-2" />
            <div className="text-center">
              <p className="font-mono font-bold text-primary text-lg">{bovin.identifiant}</p>
              <p className="text-[0.7rem] text-muted-foreground">{bovin.race} · {bovin.poidsAchat} kg</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const printWin = window.open("", "_blank", "width=400,height=300");
                if (printWin) {
                  printWin.document.write(`
                    <html><head><title>Étiquette ${bovin.identifiant}</title></head>
                    <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
                      <div style="border:2px solid #111827;border-radius:8px;padding:16px;text-align:center;">
                        <p style="font-size:24px;font-weight:700;color:#10B981;margin:0 0 4px;">${bovin.identifiant}</p>
                        <p style="font-size:12px;color:#6B7280;margin:0 0 8px;">${bovin.race} · ${bovin.poidsAchat} kg · ${formatDate(bovin.dateAchat)}</p>
                        <div style="width:120px;height:120px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;display:flex;align-items:center;justify-content:center;margin:0 auto;">
                          <span style="font-size:10px;color:#9CA3AF;">QR Code</span>
                        </div>
                        <p style="font-size:9px;color:#9CA3AF;margin-top:8px;">SAVERDEV · Sahel Vert · Développement</p>
                      </div>
                    </body></html>
                  `);
                  printWin.document.close();
                  printWin.print();
                }
              }}
            >
              <Printer className="h-4 w-4" /> Imprimer l'étiquette
            </Button>
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
