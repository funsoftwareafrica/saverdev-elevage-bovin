"use client";

// Vue Synthèse Bailleur — page d'accueil dédiée au bailleur (investisseur).
// Focus financier, pas opérationnel. Lecture seule, propre, professionnel.
import { useDashboard, useFinancement, useBovins } from "@/lib/api";
import { HugeiconsIcon } from "@hugeicons/react";
import { computeBovinMarge } from "@/lib/calculations";
import { formatFCFA, formatFCFAShort, formatDate, statutEcheanceColor, severiteColor } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SaverdevLogo } from "@/components/saverdev-logo";
import { GaugeChart } from "@/components/charts/gauge-chart";
import { ROLE_LABELS } from "@/lib/types";
import { Landmark, Wallet, TrendingUp, TrendingDown, AlertTriangle, FileText, Beef, Clock, CheckCircle2, ArrowRight, Info, Shield, PiggyBank } from "@/lib/icons";
import { Banknote,  } from "lucide-react";

export function BailleurSyntheseView() {
  const { data: dash, isLoading } = useDashboard();
  const { data: fin } = useFinancement();
  const { data: bovins } = useBovins();
  const role = useAppStore((s) => s.role);
  const setView = useAppStore((s) => s.setView);

  if (isLoading || !dash) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const tauxUtilisation = Math.round(dash.financement.tauxUtilisation);
  const alertesCritiques = dash.alertes.filter((a) => !a.resolved && a.severite === "CRITICAL");
  const echeances = fin?.echeances ?? [];
  const payees = echeances.filter((e) => e.statut === "PAYEE");
  const enRetard = echeances.filter((e) => e.statut === "EN_RETARD");
  const aPayer = echeances.filter((e) => e.statut === "A_PAYER");
  const prochaines = [...aPayer, ...enRetard].sort((a, b) => new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime()).slice(0, 4);
  const tauxMarge = dash.rentabilite.ca > 0 ? (dash.rentabilite.margeTotale / dash.rentabilite.ca) * 100 : 0;
  const nbBovins = (bovins ?? []).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* En-tête bailleur — hero gradient glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl glass-card hover-lift p-6 mb-2">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-teal/5 to-transparent animate-gradient pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SaverdevLogo size={56} variant="light" />
            <div>
              <h2 className="text-xl font-bold text-gradient">Espace Bailleur</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Connecté en tant que {ROLE_LABELS[role]}
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-primary glow-soft shrink-0" onClick={() => setView("rapport")}>
            <HugeiconsIcon icon={FileText} size={16} /> Rapport mensuel
          </Button>
        </div>
      </div>

      {/* KPIs financiers principaux */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl p-5 bg-emerald-50 border border-emerald-200 glass-card hover-lift">
          <div className="flex items-center justify-between mb-2">
            <HugeiconsIcon icon={Landmark} size={20} className="text-emerald-600" />
            <span className="text-[0.65rem] uppercase text-emerald-700 font-medium">Investi</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">{formatFCFAShort(dash.financement.montantFinance)}</p>
          <p className="text-[0.7rem] text-emerald-600 mt-1">Bailleur : {fin?.bailleur ?? "SAVERDEV"}</p>
        </div>
        <div className="rounded-2xl p-5 bg-blue-50 border border-blue-200 glass-card hover-lift">
          <div className="flex items-center justify-between mb-2">
            <HugeiconsIcon icon={CheckCircle2} size={20} className="text-blue-600" />
            <span className="text-[0.65rem] uppercase text-blue-700 font-medium">Remboursé</span>
          </div>
          <p className="text-2xl font-bold text-blue-700 tabular-nums">{formatFCFAShort(dash.financement.montantUtilise)}</p>
          <p className="text-[0.7rem] text-blue-600 mt-1">{payees.length} échéance(s) payée(s)</p>
        </div>
        <div className="rounded-2xl p-5 bg-amber-50 border border-amber-200 glass-card hover-lift">
          <div className="flex items-center justify-between mb-2">
            <HugeiconsIcon icon={PiggyBank} size={20} className="text-amber-600" />
            <span className="text-[0.65rem] uppercase text-amber-700 font-medium">Solde dû</span>
          </div>
          <p className="text-2xl font-bold text-amber-700 tabular-nums">{formatFCFAShort(dash.financement.solde)}</p>
          <p className="text-[0.7rem] text-amber-600 mt-1">{aPayer.length + enRetard.length} échéance(s) restante(s)</p>
        </div>
        <div className="rounded-2xl p-5 bg-slate-50 border border-slate-200 glass-card hover-lift">
          <div className="flex items-center justify-between mb-2">
            <HugeiconsIcon icon={TrendingUp} size={20} className="text-slate-600" />
            <span className="text-[0.65rem] uppercase text-slate-700 font-medium">Utilisation</span>
          </div>
          <p className="text-2xl font-bold text-slate-700 tabular-nums">{tauxUtilisation}%</p>
          <p className="text-[0.7rem] text-slate-500 mt-1">du financement utilisé</p>
        </div>
      </div>

      {/* Jauge remboursement + performance */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <HugeiconsIcon icon={Landmark} size={16} className="text-primary" /> Progression du remboursement
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-6">
            <GaugeChart value={tauxUtilisation} size={220} thickness={18} label="Taux de remboursement" color="#10B981" />
            <div className="grid grid-cols-3 gap-4 w-full mt-4 text-center">
              <div><p className="text-[0.6rem] uppercase text-muted-foreground">Payées</p><p className="text-lg font-bold text-emerald-600">{payees.length}</p></div>
              <div><p className="text-[0.6rem] uppercase text-muted-foreground">À payer</p><p className="text-lg font-bold text-amber-600">{aPayer.length}</p></div>
              <div><p className="text-[0.6rem] uppercase text-muted-foreground">En retard</p><p className="text-lg font-bold text-red-600">{enRetard.length}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <HugeiconsIcon icon={TrendingUp} size={16} className="text-primary" /> Performance de l'exploitation
            </CardTitle>
            <CardDescription className="text-xs">Chiffres clés de l'activité d'engraissement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[0.6rem] uppercase text-muted-foreground">Bovins en cheptel</p>
                <p className="text-xl font-bold text-foreground">{nbBovins}</p>
                <p className="text-[0.65rem] text-muted-foreground">{dash.cheptel.bovinsActifs} actifs · {dash.cheptel.bovinsVendus} vendus</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[0.6rem] uppercase text-muted-foreground">Valeur du cheptel</p>
                <p className="text-xl font-bold text-foreground">{formatFCFAShort(dash.cheptel.valeurCheptel)}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-[0.6rem] uppercase text-emerald-700">Chiffre d'affaires</p>
                <p className="text-xl font-bold text-emerald-700">{formatFCFAShort(dash.rentabilite.ca)}</p>
              </div>
              <div className={`rounded-lg p-3 ${dash.rentabilite.margeTotale >= 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                <p className="text-[0.6rem] uppercase text-muted-foreground">Marge totale</p>
                <p className={`text-xl font-bold ${dash.rentabilite.margeTotale >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {formatFCFAShort(dash.rentabilite.margeTotale)}
                </p>
                <p className="text-[0.6rem] text-muted-foreground">Taux : {tauxMarge.toFixed(0)}%</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Info} size={12} className=".5 .5 shrink-0" />
              <span>Ces données reflètent l'activité d'engraissement financée par {fin?.bailleur ?? "SAVERDEV"}.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes critiques + prochaines échéances */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <HugeiconsIcon icon={AlertTriangle} size={16} className="text-amber-600" /> Alertes
            </CardTitle>
            <CardDescription className="text-xs">{alertesCritiques.length} alerte(s) critique(s) à traiter</CardDescription>
          </CardHeader>
          <CardContent>
            {alertesCritiques.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 py-3">
                <HugeiconsIcon icon={CheckCircle2} size={20} /> Aucune alerte critique. L'exploitation est sous contrôle.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto scroll-thin">
                {alertesCritiques.map((a) => (
                  <div key={a.id} className={`rounded-lg border px-3 py-2 ${severiteColor(a.severite)}`}>
                    <p className="text-xs font-medium">{a.message}</p>
                    <p className="text-[0.6rem] opacity-70 mt-0.5">{formatDate(a.date)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <HugeiconsIcon icon={Clock} size={16} className="text-primary" /> Prochaines échéances
            </CardTitle>
            <CardDescription className="text-xs">Calendrier de remboursement</CardDescription>
          </CardHeader>
          <CardContent>
            {prochaines.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune échéance à venir.</p>
            ) : (
              <div className="space-y-2">
                {prochaines.map((e) => (
                  <div key={e.id} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${statutEcheanceColor(e.statut)}`}>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs bg-white/50">
                        {e.numero}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{formatDate(e.datePrevue)}</p>
                        <p className="text-[0.6rem] opacity-70">{e.statut === "EN_RETARD" ? "En retard" : "À payer"}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{formatFCFA(e.montant, false)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA rapport */}
      <Card className="border-primary/30 bg-primary/5 glass-card glow-soft">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HugeiconsIcon icon={FileText} size={32} className="text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Rapport mensuel détaillé</p>
              <p className="text-xs text-muted-foreground">Synthèse complète, exportable en PDF, pour suivi bailleur</p>
            </div>
          </div>
          <Button className="bg-primary" onClick={() => setView("rapport")}>
            Consulter <HugeiconsIcon icon={ArrowRight} size={16} />
          </Button>
        </CardContent>
      </Card>

      {/* Mention */}
      <div className="flex items-center gap-2 text-[0.7rem] text-muted-foreground justify-center pb-4">
        <HugeiconsIcon icon={Shield} size={12} className=".5 .5" />
        Accès en lecture seule — Vos données sont protégées (cahier des charges §9)
      </div>
    </div>
  );
}
