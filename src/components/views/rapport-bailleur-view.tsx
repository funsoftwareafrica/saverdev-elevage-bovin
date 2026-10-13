"use client";

// Vue Rapport Bailleur — modèle Excel E2A (Tableau de Bord SAVERDEV)
// 6 KPI colorés + 5 graphiques + 4 sections analytiques + annexes imprimables.
// Données dynamiques via /api/rapport-bailleur (12 mois de l'exercice).
//
// Task 29 — refonte :
//  - Suppression du BarChart "Achats vs Ventes" (redondant avec Saisie).
//  - Section A : Balance comptable (N-1 figé / mouvements N / solde N).
//  - Section B : Suivi du financement (capital initial + mouvements horodatés +
//                formulaire d'ajout — déplacé depuis la vue Saisie).
//  - Section C : Suivi budgétaire (Investissement / Opérationnel / Trésorerie).
//  - Section D : Dépenses d'investissement en immobilisations + dialog d'ajout.

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRapportBailleur, useFinancement } from "@/lib/api";
import { HugeiconsIcon } from "@hugeicons/react";
import { RAPPORT_KPI_COLORS, COST_STRUCTURE_COLORS } from "@/lib/config";
import { formatFCFA, formatFCFAShort, formatDate, severiteColor, statutEcheanceColor, nowDateTimeLocal } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import { SaverdevLogo } from "@/components/saverdev-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { LazyMount } from "@/components/lazy-mount";
import {
  FileText, Printer, Download, CheckCircle2, AlertCircle,
  Plus, AlertTriangle, Scale, Landmark, Wallet,
} from "@/lib/icons";
import { toast } from "sonner";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import type {
  BalanceLigne, BudgetLigne, BudgetSection, CapitalMouvementItem,
} from "@/lib/types";

// Couleurs du modèle Excel E2A (source : src/lib/config.ts)
const KPI_COLORS = RAPPORT_KPI_COLORS;
const DOUGHNUT_COLORS = [COST_STRUCTURE_COLORS.achatBovin, COST_STRUCTURE_COLORS.alimentation, COST_STRUCTURE_COLORS.autresCouts];

export function RapportBailleurView() {
  const selectedMonth = useAppStore((s) => s.selectedMonth);
  const year = selectedMonth ? parseInt(selectedMonth.split("-")[0], 10) : new Date().getFullYear();
  const qc = useQueryClient();
  const { data: rap, isLoading } = useRapportBailleur(year);
  const { data: fin } = useFinancement();

  // --- Section B : formulaire d'ajout d'un mouvement de capital ---
  const [mvtDate, setMvtDate] = useState<string>(nowDateTimeLocal());
  const [mvtType, setMvtType] = useState<"ENTREE" | "SORTIE">("SORTIE");
  const [mvtMontant, setMvtMontant] = useState<string>("");
  const [mvtLibelle, setMvtLibelle] = useState<string>("");
  const [mvtSaving, setMvtSaving] = useState(false);

  // --- Section D : dialog d'ajout d'une dépense d'investissement ---
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [invDate, setInvDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [invLibelle, setInvLibelle] = useState<string>("");
  const [invSousCat, setInvSousCat] = useState<string>("Hangar");
  const [invMontant, setInvMontant] = useState<string>("");
  const [invSaving, setInvSaving] = useState(false);

  if (isLoading || !rap) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <HugeiconsIcon icon={FileText} size={20} className="text-primary" /> Rapport bailleur
        </h2>
        <div className="space-y-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-16"/>)}</div>
      </div>
    );
  }

  const handlePrint = () => {
    toast.info("Préparation du PDF...", { description: "Utilisez « Imprimer » puis « Enregistrer en PDF »." });
    setTimeout(() => window.print(), 300);
  };

  const handleExportXlsx = () => {
    const url = `/api/rapport-bailleur/export-xlsx?annee=${year}`;
    toast.info("Génération Excel en cours…", { description: `rapport-bailleur-${year}.xlsx` });
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-bailleur-${year}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => toast.success("Excel téléchargé"), 800);
  };

  // Invalide le cache du rapport bailleur (forces un re-fetch après mutation).
  const invalidateRapport = () => {
    qc.invalidateQueries({ queryKey: ["rapport-bailleur", year] });
    qc.invalidateQueries({ queryKey: ["rapport-bailleur"] });
  };

  // --- Handlers Section B (Suivi du financement) ---
  const handleSaveMouvement = async () => {
    const montant = Number(mvtMontant.replace(/\s/g, ""));
    if (!montant || montant <= 0) {
      toast.error("Veuillez saisir un montant valide");
      return;
    }
    setMvtSaving(true);
    try {
      const res = await fetch("/api/saisie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "capital_mouvement",
          typeMvt: mvtType,
          date: mvtDate,
          montant,
          libelle: mvtLibelle.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur");
        setMvtSaving(false);
        return;
      }
      toast.success(mvtType === "ENTREE" ? "Ajout enregistré" : "Retrait enregistré");
      setMvtMontant("");
      setMvtLibelle("");
      setMvtDate(nowDateTimeLocal());
      invalidateRapport();
    } catch {
      toast.error("Connexion perdue");
    }
    setMvtSaving(false);
  };

  const handleDeleteMouvement = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch("/api/saisie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "capital_mouvement_delete", id }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la suppression");
        return;
      }
      toast.success("Mouvement supprimé");
      invalidateRapport();
    } catch {
      toast.error("Connexion perdue");
    }
  };

  // --- Handlers Section D (Investissements) ---
  const handleSaveInvestissement = async () => {
    if (!invLibelle || !invMontant) {
      toast.error("Libellé et montant requis");
      return;
    }
    const montant = Number(invMontant);
    if (isNaN(montant) || montant <= 0) {
      toast.error("Montant invalide");
      return;
    }
    setInvSaving(true);
    // La catégorie DB reste "Immobilisation" (compte 23). Le sous-type
    // (Hangar/Équipement/Clôture/Autre) est préfixé dans le libellé pour
    // permettre le filtrage ultérieur tout en gardant une catégorie simple.
    const libelleComplet = `[${invSousCat}] ${invLibelle.trim()}`;
    try {
      const res = await fetch("/api/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: invDate,
          categorie: "Immobilisation",
          libelle: libelleComplet,
          montant,
          nbBovinsConcernes: 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de l'enregistrement");
        setInvSaving(false);
        return;
      }
      toast.success("Dépense d'investissement enregistrée");
      setInvLibelle("");
      setInvMontant("");
      setInvSousCat("Hangar");
      setInvDate(new Date().toISOString().split("T")[0]);
      setInvestDialogOpen(false);
      invalidateRapport();
    } catch {
      toast.error("Connexion perdue");
    }
    setInvSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Bandeau d'actions (non imprimé) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <HugeiconsIcon icon={FileText} size={20} className="text-primary" /> Rapport bailleur
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Tableau de bord — modèle E2A, exercice {year}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <HugeiconsIcon icon={Printer} size={16} /> Imprimer
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportXlsx} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <HugeiconsIcon icon={Download} size={16} /> Export Excel
          </Button>
        </div>
      </div>

      {/* ============ PAGE 1 : Tableau de bord ============ */}
      <Card className="print-page border-border shadow-sm">
        {/* En-tête — bandeau vert foncé comme le modèle Excel */}
        <div className="flex items-center justify-between gap-4 p-5 border-b border-border" style={{ background: "#14532A" }}>
          <div className="flex items-center gap-3">
            <SaverdevLogo size={48} variant="light" />
            <div>
              <h3 className="font-bold text-white text-lg">SAVERDEV DURABLE — Tableau de bord</h3>
              <p className="text-[0.65rem] uppercase tracking-wider text-white/70">Sahel Vert · Développement</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[0.65rem] uppercase tracking-wider text-white/70">Reporting mensuel destiné au bailleur</p>
            <p className="text-sm text-white/90">Exercice {year} · montants en FCFA</p>
          </div>
        </div>

        <CardContent className="p-5 space-y-5">
          {/* === 6 KPI colorés (modèle Excel E2A) === */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <RapportKpiCard label="Animaux actifs (fin)" value={String(rap.kpis.bovinsActifs)} color={KPI_COLORS.bovinsActifs} />
            <RapportKpiCard label="Chiffre d'affaires cumulé" value={formatFCFAShort(rap.kpis.caCumul)} color={KPI_COLORS.ca} />
            <RapportKpiCard label="Marge totale cumulée" value={formatFCFAShort(rap.kpis.margeTotale)} color={KPI_COLORS.marge} />
            <RapportKpiCard label="Marge moyenne / tête" value={formatFCFA(rap.kpis.margeParTete)} color={KPI_COLORS.margeParTete} />
            <RapportKpiCard label="Taux util. fin." value={`${Math.round(rap.kpis.tauxUtilisation)}%`} color={KPI_COLORS.tauxUtil} />
            <RapportKpiCard label="Trésorerie disponible" value={formatFCFAShort(rap.kpis.tresorerie)} color={KPI_COLORS.tresorerie} />
          </div>

          {/* === GRAPHIQUES (modèle Excel E2A — 5 charts après suppression d'Achats vs Ventes) === */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. AreaChart — Évolution du cheptel */}
            <RapportChartCard title="Évolution du cheptel (animaux actifs)" height={220}>
              <LazyMount className="h-full" fallback={<Skeleton className="h-full w-full rounded-md" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rap.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rCheptel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={KPI_COLORS.bovinsActifs} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={KPI_COLORS.bovinsActifs} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10 }} stroke="#6B7280" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#6B7280" />
                    <Tooltip contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                    <Area isAnimationActive animationDuration={1000} type="monotone" dataKey="bovinsActifs" name="Animaux actifs" stroke={KPI_COLORS.bovinsActifs} strokeWidth={2.5} fill="url(#rCheptel)" />
                  </AreaChart>
                </ResponsiveContainer>
              </LazyMount>
            </RapportChartCard>

            {/* 2. BarChart — CA & marge (était n°3 — renuméroté après suppression d'Achats vs Ventes) */}
            <RapportChartCard title="Chiffre d'affaires & marge (FCFA / mois)" height={220}>
              <LazyMount className="h-full" fallback={<Skeleton className="h-full w-full rounded-md" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rap.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10 }} stroke="#6B7280" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#6B7280" tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")} />
                    <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                    <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                    <Bar isAnimationActive animationDuration={1000} dataKey="ca" name="CA" fill="#1E6091" radius={[3, 3, 0, 0]} />
                    <Bar isAnimationActive animationDuration={1000} dataKey="margeTotale" name="Marge" fill="#14532A" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </LazyMount>
            </RapportChartCard>

            {/* 3. LineChart — Marge/tête & coût alimentation/tête */}
            <RapportChartCard title="Marge/tête & coût alimentation/tête" height={220}>
              <LazyMount className="h-full" fallback={<Skeleton className="h-full w-full rounded-md" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rap.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10 }} stroke="#6B7280" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#6B7280" tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")} />
                    <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                    <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                    <Line isAnimationActive animationDuration={1200} type="monotone" dataKey="margeParTete" name="Marge/tête" stroke="#0F766E" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line isAnimationActive animationDuration={1200} type="monotone" dataKey="coutAlimParTete" name="Coût alim./tête" stroke="#E0A008" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </LazyMount>
            </RapportChartCard>

            {/* 4. Pie/Donut — Structure des coûts (cumul) */}
            <RapportChartCard title="Structure des coûts (cumul)" height={220}>
              <LazyMount className="h-full" fallback={<Skeleton className="h-full w-full rounded-md" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Achat des bovins", value: rap.costStructure.achatBovins },
                        { name: "Alimentation", value: rap.costStructure.alimentation },
                        { name: "Engraissement (autres)", value: rap.costStructure.engraissement },
                      ]}
                      dataKey="value" nameKey="name" cx="50%" cy="50%"
                      outerRadius={80} innerRadius={45} paddingAngle={3}
                      isAnimationActive animationDuration={1000}
                    >
                      {DOUGHNUT_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                    <Legend wrapperStyle={{ fontSize: "0.65rem" }} iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </LazyMount>
            </RapportChartCard>

            {/* 5. BarChart — Financement utilisé vs trésorerie */}
            <RapportChartCard title="Financement utilisé (cumul) vs trésorerie" height={220}>
              <LazyMount className="h-full" fallback={<Skeleton className="h-full w-full rounded-md" />}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rap.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10 }} stroke="#6B7280" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#6B7280" tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")} />
                    <Tooltip formatter={(v: number) => formatFCFA(v)} contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem" }} />
                    <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
                    <Bar isAnimationActive animationDuration={1000} dataKey="financementUtilise" name="Financement utilisé" fill="#E0A008" radius={[3, 3, 0, 0]} />
                    <Bar isAnimationActive animationDuration={1000} dataKey="tresorerie" name="Trésorerie" fill="#8D6E63" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </LazyMount>
            </RapportChartCard>
          </div>
        </CardContent>
      </Card>

      {/* ============ SECTION A : Balance comptable ============ */}
      <Card className="print-page border-border shadow-sm">
        <CardHeader className="bg-secondary/5 border-b border-border">
          <CardTitle className="text-sm flex items-center gap-2">
            <HugeiconsIcon icon={Scale} size={16} className="text-primary" /> Section A — Balance comptable
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <BalanceTable lignes={rap.balance.lignes} totalDebitGeneral={rap.balance.totalDebitGeneral} totalCreditGeneral={rap.balance.totalCreditGeneral} soldeDebitGeneral={rap.balance.soldeDebitGeneral} soldeCreditGeneral={rap.balance.soldeCreditGeneral} />
        </CardContent>
      </Card>

      {/* ============ SECTION B : Suivi du financement ============ */}
      <Card className="print-page border-border shadow-sm">
        <CardHeader className="bg-secondary/5 border-b border-border">
          <CardTitle className="text-sm flex items-center gap-2">
            <HugeiconsIcon icon={Landmark} size={16} className="text-primary" /> Section B — Suivi du financement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <SuiviFinancement
            capitalInitial={rap.capital.capitalInitial}
            totalEntrees={rap.capital.totalEntrees}
            totalSorties={rap.capital.totalSorties}
            soldeRestant={rap.capital.soldeRestant}
            nbMouvements={rap.capital.nbMouvements}
            mouvements={rap.capital.mouvements}
            mvtDate={mvtDate}
            mvtType={mvtType}
            mvtMontant={mvtMontant}
            mvtLibelle={mvtLibelle}
            mvtSaving={mvtSaving}
            onMvtDateChange={setMvtDate}
            onMvtTypeChange={setMvtType}
            onMvtMontantChange={setMvtMontant}
            onMvtLibelleChange={setMvtLibelle}
            onSaveMouvement={handleSaveMouvement}
            onDeleteMouvement={handleDeleteMouvement}
          />
        </CardContent>
      </Card>

      {/* ============ SECTION C : Suivi budgétaire ============ */}
      <Card className="print-page border-border shadow-sm">
        <CardHeader className="bg-secondary/5 border-b border-border">
          <CardTitle className="text-sm flex items-center gap-2">
            <HugeiconsIcon icon={Wallet} size={16} className="text-primary" /> Section C — Suivi budgétaire
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <BudgetTable sections={rap.budget.sections} totalGeneral={rap.budget.totalGeneral} />
        </CardContent>
      </Card>

      {/* ============ SECTION D : Dépenses d'investissement en immobilisations ============ */}
      <Card className="print-page border-border shadow-sm">
        <CardHeader className="bg-secondary/5 border-b border-border no-print">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <HugeiconsIcon icon={Plus} size={16} className="text-primary" /> Section D — Dépenses d'investissement en immobilisations
            </CardTitle>
            <Button size="sm" onClick={() => setInvestDialogOpen(true)} className="bg-primary">
              <HugeiconsIcon icon={Plus} size={14} /> Ajouter une dépense d'investissement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <InvestissementsTable investissements={rap.investissements} />
        </CardContent>
      </Card>

      {/* ============ PAGE 2 : Annexes détaillées ============ */}
      <Card className="print-page border-border shadow-sm">
        <CardHeader className="bg-secondary/5 border-b border-border">
          <CardTitle className="text-sm">Annexe — Détail des ventes, animaux actifs et échéances</CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          {/* Tableau mensuel récapitulatif */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Récapitulatif mensuel — exercice {year}</h4>
            <div className="rounded-md border border-border overflow-x-auto">
              <table className="w-full text-xs min-w-[800px]">
                <thead className="bg-muted/60">
                  <tr className="text-left">
                    <th className="p-2 font-medium">Mois</th>
                    <th className="p-2 font-medium text-right">Actifs</th>
                    <th className="p-2 font-medium text-right">Achats</th>
                    <th className="p-2 font-medium text-right">Ventes</th>
                    <th className="p-2 font-medium text-right">CA</th>
                    <th className="p-2 font-medium text-right">Coût alim.</th>
                    <th className="p-2 font-medium text-right">Marge</th>
                    <th className="p-2 font-medium text-right">Marge/tête</th>
                    <th className="p-2 font-medium text-right">Trésorerie</th>
                  </tr>
                </thead>
                <tbody>
                  {rap.monthly.map((row) => (
                    <tr key={row.mois} className="border-t border-border">
                      <td className="p-2 font-medium">{row.mois}</td>
                      <td className="p-2 text-right tabular-nums">{row.bovinsActifs}</td>
                      <td className="p-2 text-right tabular-nums">{row.achats}</td>
                      <td className="p-2 text-right tabular-nums">{row.ventes}</td>
                      <td className="p-2 text-right tabular-nums">{row.ca > 0 ? formatFCFAShort(row.ca) : "—"}</td>
                      <td className="p-2 text-right tabular-nums">{row.coutAlimentation > 0 ? formatFCFAShort(row.coutAlimentation) : "—"}</td>
                      <td className={`p-2 text-right tabular-nums font-medium ${row.margeTotale >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {row.ca > 0 || row.margeTotale !== 0 ? formatFCFAShort(row.margeTotale) : "—"}
                      </td>
                      <td className="p-2 text-right tabular-nums">{row.ventes > 0 ? formatFCFA(row.margeParTete, false) : "—"}</td>
                      <td className={`p-2 text-right tabular-nums ${row.tresorerie >= 0 ? "" : "text-red-600"}`}>{formatFCFAShort(row.tresorerie)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Échéances détaillées */}
          {fin && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Tableau d'amortissement — {fin.bailleur}</h4>
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60">
                    <tr className="text-left">
                      <th className="p-2 font-medium">N°</th>
                      <th className="p-2 font-medium">Date prévue</th>
                      <th className="p-2 font-medium hidden sm:table-cell">Date payée</th>
                      <th className="p-2 font-medium text-right">Montant</th>
                      <th className="p-2 font-medium text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fin.echeances.map((e) => (
                      <tr key={e.id} className="border-t border-border">
                        <td className="p-2 font-mono font-semibold">{e.numero}</td>
                        <td className="p-2">{formatDate(e.datePrevue)}</td>
                        <td className="p-2 hidden sm:table-cell text-muted-foreground">{e.datePayee ? formatDate(e.datePayee) : "—"}</td>
                        <td className="p-2 text-right tabular-nums">{formatFCFA(e.montant, false)}</td>
                        <td className="p-2 text-center">
                          <Badge variant="outline" className={`text-[0.6rem] ${statutEcheanceColor(e.statut)}`}>
                            {e.statut === "PAYEE" ? "Payée" : e.statut === "A_PAYER" ? "À payer" : "En retard"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Alertes & faits marquants */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <HugeiconsIcon icon={AlertCircle} size={12} className="shrink-0" /> Alertes & faits marquants
            </h4>
            <div className="space-y-2">
              {rap.alertes.filter((a) => !a.resolved).map((a) => (
                <div key={a.id} className={`rounded-md border px-3 py-2 text-xs ${severiteColor(a.severite)}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{a.message}</span>
                    <span className="text-[0.6rem] uppercase font-semibold">{a.severite}</span>
                  </div>
                </div>
              ))}
              {rap.alertes.filter((a) => !a.resolved).length === 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-700">
                  <HugeiconsIcon icon={CheckCircle2} size={16} /> Aucune alerte active.
                </div>
              )}
            </div>
          </div>

          {/* Pied de page du rapport */}
          <div className="pt-4 border-t border-border text-[0.65rem] text-muted-foreground text-center">
            Document généré le {formatDate(new Date().toISOString())} · SAVERDEV DURABLE — Sahel Vert pour un Développement Durable · Confidentiel
          </div>
        </CardContent>
      </Card>

      {/* ============ DIALOG : Ajout d'une dépense d'investissement ============ */}
      <Dialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Plus} size={16} className="text-primary" /> Nouvelle dépense d'investissement
            </DialogTitle>
            <DialogDescription>
              Compte 23 — Immobilisations. La dépense sera enregistrée avec la catégorie « Immobilisation ».
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="inv-date" className="text-xs">Date</Label>
                <Input id="inv-date" type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} className="text-sm h-9" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="inv-cat" className="text-xs">Sous-catégorie</Label>
                <Select value={invSousCat} onValueChange={setInvSousCat}>
                  <SelectTrigger id="inv-cat" className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hangar" className="text-sm">Hangar</SelectItem>
                    <SelectItem value="Équipement" className="text-sm">Équipement</SelectItem>
                    <SelectItem value="Clôture" className="text-sm">Clôture</SelectItem>
                    <SelectItem value="Autre" className="text-sm">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="inv-libelle" className="text-xs">Libellé</Label>
              <Input
                id="inv-libelle"
                placeholder="ex: Achat de tôles pour toiture hangar"
                value={invLibelle}
                onChange={(e) => setInvLibelle(e.target.value)}
                className="text-sm h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="inv-montant" className="text-xs">Montant (FCFA)</Label>
              <Input
                id="inv-montant"
                type="number"
                inputMode="numeric"
                placeholder="ex: 350000"
                value={invMontant}
                onChange={(e) => setInvMontant(e.target.value)}
                className="text-sm h-9 tabular-nums"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveInvestissement} disabled={invSaving} className="bg-primary">
              {invSaving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ====== Sous-composants ======

// KPI coloré — style identique au modèle Excel E2A
function RapportKpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="rounded-lg p-3 text-white shadow-md"
      style={{ background: color }}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider leading-tight">{label}</p>
      <p className="text-xl font-bold tabular-nums mt-1.5">{value}</p>
    </motion.div>
  );
}

// Carte conteneur pour graphique
function RapportChartCard({ title, height, children }: { title: string; height: number; children: React.ReactNode }) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent style={{ height }} className="pt-1">
        {children}
      </CardContent>
    </Card>
  );
}

// ---- Section A : Balance comptable ----
function BalanceTable({
  lignes, totalDebitGeneral, totalCreditGeneral, soldeDebitGeneral, soldeCreditGeneral,
}: {
  lignes: BalanceLigne[];
  totalDebitGeneral: number; totalCreditGeneral: number;
  soldeDebitGeneral: number; soldeCreditGeneral: number;
}) {
  const soldeGeneralNet = soldeDebitGeneral - soldeCreditGeneral;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[760px]">
        <thead>
          <tr className="border-b-2 border-border text-left bg-muted/60">
            <th className="p-2" rowSpan={2}>Compte</th>
            <th className="p-2" rowSpan={2}>Libellé</th>
            <th className="p-2 text-center border-l border-border" colSpan={2}>Solde N-1</th>
            <th className="p-2 text-center border-l border-border" colSpan={2}>Mouvements N</th>
            <th className="p-2 text-center border-l border-border" colSpan={2}>Solde N</th>
          </tr>
          <tr className="border-b border-border text-left text-[0.6rem] bg-muted/60">
            <th className="p-2 text-right border-l border-border">Débit</th>
            <th className="p-2 text-right">Crédit</th>
            <th className="p-2 text-right border-l border-border">Débit</th>
            <th className="p-2 text-right">Crédit</th>
            <th className="p-2 text-right border-l border-border">Débit</th>
            <th className="p-2 text-right">Crédit</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((c, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
              <td className="p-2 font-mono font-bold">{c.numCompte}</td>
              <td className="p-2 text-foreground">{c.libelle}</td>
              <td className="p-2 text-right tabular-nums text-muted-foreground">—</td>
              <td className="p-2 text-right tabular-nums text-muted-foreground">—</td>
              <td className="p-2 text-right tabular-nums text-red-600">{c.mvtNDebit > 0 ? formatFCFA(c.mvtNDebit, false) : ""}</td>
              <td className="p-2 text-right tabular-nums text-emerald-600">{c.mvtNCredit > 0 ? formatFCFA(c.mvtNCredit, false) : ""}</td>
              <td className="p-2 text-right tabular-nums font-bold text-red-600">{c.soldeNDebit > 0 ? formatFCFA(c.soldeNDebit, false) : ""}</td>
              <td className="p-2 text-right tabular-nums font-bold text-emerald-600">{c.soldeNCredit > 0 ? formatFCFA(c.soldeNCredit, false) : ""}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border font-bold bg-muted/30">
            <td className="p-2" colSpan={2}>Total général</td>
            <td className="p-2 text-right tabular-nums text-muted-foreground">—</td>
            <td className="p-2 text-right tabular-nums text-muted-foreground">—</td>
            <td className="p-2 text-right tabular-nums text-red-600">{formatFCFA(totalDebitGeneral, false)}</td>
            <td className="p-2 text-right tabular-nums text-emerald-600">{formatFCFA(totalCreditGeneral, false)}</td>
            <td className="p-2 text-right tabular-nums text-red-600">{formatFCFA(soldeDebitGeneral, false)}</td>
            <td className="p-2 text-right tabular-nums text-emerald-600">{formatFCFA(soldeCreditGeneral, false)}</td>
          </tr>
        </tfoot>
      </table>
      <div className="mt-3 flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">Solde général (Débit − Crédit)</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold tabular-nums ${soldeGeneralNet > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {formatFCFA(Math.abs(soldeGeneralNet), false)}
          </span>
          <Badge variant="outline" className={soldeGeneralNet > 0 ? "text-red-700 border-red-300 bg-red-50" : "text-emerald-700 border-emerald-300 bg-emerald-50"}>
            {soldeGeneralNet > 0 ? "Solde débitaire" : "Solde créditaire"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ---- Section B : Suivi du financement ----
interface SuiviFinancementProps {
  capitalInitial: number;
  totalEntrees: number;
  totalSorties: number;
  soldeRestant: number;
  nbMouvements: number;
  mouvements: CapitalMouvementItem[];
  // form state
  mvtDate: string;
  mvtType: "ENTREE" | "SORTIE";
  mvtMontant: string;
  mvtLibelle: string;
  mvtSaving: boolean;
  onMvtDateChange: (v: string) => void;
  onMvtTypeChange: (v: "ENTREE" | "SORTIE") => void;
  onMvtMontantChange: (v: string) => void;
  onMvtLibelleChange: (v: string) => void;
  onSaveMouvement: () => void;
  onDeleteMouvement: (id: string) => void;
}

function SuiviFinancement({
  capitalInitial, totalEntrees, totalSorties, soldeRestant, nbMouvements, mouvements,
  mvtDate, mvtType, mvtMontant, mvtLibelle, mvtSaving,
  onMvtDateChange, onMvtTypeChange, onMvtMontantChange, onMvtLibelleChange,
  onSaveMouvement, onDeleteMouvement,
}: SuiviFinancementProps) {
  return (
    <>
      {/* Capital initial — toujours visible, non modifié */}
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3 text-center">
        <p className="text-[0.6rem] uppercase tracking-wide text-primary font-semibold flex items-center justify-center gap-1.5">
          <HugeiconsIcon icon={Landmark} size={12} /> Capital initial (figé)
        </p>
        <p className="text-xl font-extrabold text-primary tabular-nums mt-0.5">{formatFCFA(capitalInitial)}</p>
        <p className="text-[0.55rem] text-muted-foreground">Cette valeur n'est jamais modifiée par les mouvements ci-dessous</p>
      </div>

      {/* Résumé des mouvements */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-center">
          <p className="text-[0.6rem] uppercase text-emerald-700 font-medium">Ajouts</p>
          <p className="text-sm font-bold text-emerald-700 tabular-nums">+ {formatFCFA(totalEntrees, false)}</p>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-center">
          <p className="text-[0.6rem] uppercase text-red-700 font-medium">Retraits</p>
          <p className="text-sm font-bold text-red-700 tabular-nums">− {formatFCFA(totalSorties, false)}</p>
        </div>
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-2 text-center">
          <p className="text-[0.6rem] uppercase text-primary font-medium">Solde actuel</p>
          <p className="text-sm font-bold text-primary tabular-nums">{formatFCFA(soldeRestant, false)}</p>
        </div>
      </div>

      {/* Formulaire d'ajout d'un mouvement horodaté */}
      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2.5 no-print">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Plus} size={14} className="text-primary" />
          <p className="text-xs font-semibold text-foreground">Nouvelle opération sur le capital</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="mvt-date" className="text-[0.6rem] uppercase text-muted-foreground">Date & heure</Label>
            <Input id="mvt-date" type="datetime-local" value={mvtDate} onChange={(e) => onMvtDateChange(e.target.value)} className="text-xs h-8" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mvt-type" className="text-[0.6rem] uppercase text-muted-foreground">Sens de l'opération</Label>
            <Select value={mvtType} onValueChange={(v) => onMvtTypeChange(v as "ENTREE" | "SORTIE")}>
              <SelectTrigger id="mvt-type" className="text-xs h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SORTIE">− Retrait (sortie de capital)</SelectItem>
                <SelectItem value="ENTREE">+ Ajout (entrée de capital)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="mvt-montant" className="text-[0.6rem] uppercase text-muted-foreground">Montant (FCFA)</Label>
            <Input id="mvt-montant" type="number" inputMode="numeric" placeholder="ex: 150000" value={mvtMontant} onChange={(e) => onMvtMontantChange(e.target.value)} className="text-xs h-8 tabular-nums" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mvt-libelle" className="text-[0.6rem] uppercase text-muted-foreground">Motif / libellé</Label>
            <Input id="mvt-libelle" placeholder="ex: Achat alimentation" value={mvtLibelle} onChange={(e) => onMvtLibelleChange(e.target.value)} className="text-xs h-8" />
          </div>
        </div>
        <Button
          onClick={onSaveMouvement}
          disabled={mvtSaving}
          size="sm"
          className={`w-full text-xs ${mvtType === "ENTREE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}
        >
          {mvtSaving ? "Enregistrement…" : (mvtType === "ENTREE" ? "+ Ajouter au capital" : "− Soustraire du capital")}
        </Button>
      </div>

      {/* Mouvements horodatés en cascade */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">Historique des opérations ({nbMouvements})</p>
          <p className="text-[0.55rem] text-muted-foreground">tri : récent → ancien</p>
        </div>
        <div className="max-h-80 overflow-y-auto pr-1 -mr-1 space-y-0">
          <AnimatePresence mode="popLayout">
            {mouvements.map((m, i) => (
              <motion.div
                key={m.id ?? `${m.date}-${i}`}
                layout
                initial={{ opacity: 0, x: -30, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: -30, height: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className={`relative overflow-hidden rounded-lg border pl-3 pr-2 py-2 ${m.sens === "sortie" ? "border-red-200 bg-red-50/40" : "border-emerald-200 bg-emerald-50/40"}`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${m.sens === "sortie" ? "bg-red-500" : "bg-emerald-500"}`} />
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {m.libelle || (m.sens === "entree" ? "Ajout de capital" : "Retrait de capital")}
                    </p>
                    <p className="text-[0.6rem] text-muted-foreground tabular-nums">
                      <span className="font-medium">{m.date}</span> · {m.typeLabel}
                      {m.saisiePar ? ` · par ${m.saisiePar}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <p className={`text-sm font-bold tabular-nums ${m.sens === "sortie" ? "text-red-600" : "text-emerald-600"}`}>
                        {m.sens === "sortie" ? "−" : "+"} {formatFCFA(m.montant, false)}
                      </p>
                      <p className="text-[0.55rem] text-muted-foreground">Solde : {formatFCFA(m.soldeApres, false)}</p>
                    </div>
                    <button
                      onClick={() => onDeleteMouvement(m.id)}
                      title="Supprimer ce mouvement"
                      className="no-print text-muted-foreground hover:text-red-600 transition-colors p-1 rounded"
                    >
                      <HugeiconsIcon icon={AlertTriangle} size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {mouvements.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-6">
              Aucune opération enregistrée. Ajoutez votre premier mouvement ci-dessus.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ---- Section C : Suivi budgétaire ----
function BudgetTable({ sections, totalGeneral }: { sections: BudgetSection[]; totalGeneral: BudgetLigne }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[640px]">
        <thead className="bg-muted/60">
          <tr className="border-b-2 border-border text-left">
            <th className="p-2 font-medium">Poste</th>
            <th className="p-2 font-medium text-right">Prévision</th>
            <th className="p-2 font-medium text-right">Réel</th>
            <th className="p-2 font-medium text-right">Écart</th>
            <th className="p-2 font-medium text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <BudgetSectionRows key={section.key} section={section} />
          ))}
          <tr className="border-t-2 border-border font-bold bg-muted/30">
            <td className="p-2">{totalGeneral.poste}</td>
            <td className="p-2 text-right tabular-nums">{formatFCFA(totalGeneral.previs, false)}</td>
            <td className="p-2 text-right tabular-nums">{formatFCFA(totalGeneral.reel, false)}</td>
            <td className={`p-2 text-right tabular-nums ${totalGeneral.ecart >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {totalGeneral.ecart >= 0 ? "+" : "−"} {formatFCFA(Math.abs(totalGeneral.ecart), false)}
            </td>
            <td className={`p-2 text-right tabular-nums font-bold ${totalGeneral.pct <= 100 ? "text-emerald-700" : "text-red-700"}`}>
              {Math.round(totalGeneral.pct)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function BudgetSectionRows({ section }: { section: BudgetSection }) {
  return (
    <>
      <tr className="border-t-2 border-border bg-secondary/10">
        <td className="p-2 font-semibold uppercase tracking-wide text-[0.65rem] text-muted-foreground" colSpan={5}>
          {section.titre}
        </td>
      </tr>
      {section.lignes.map((ligne, i) => (
        <tr key={`${section.key}-${i}`} className="border-b border-border/40 hover:bg-muted/30">
          <td className="p-2 pl-4">{ligne.poste}</td>
          <td className="p-2 text-right tabular-nums">{formatFCFA(ligne.previs, false)}</td>
          <td className="p-2 text-right tabular-nums">{formatFCFA(ligne.reel, false)}</td>
          <td className={`p-2 text-right tabular-nums ${ligne.ecart >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            {ligne.ecart >= 0 ? "+" : "−"} {formatFCFA(Math.abs(ligne.ecart), false)}
          </td>
          <td className={`p-2 text-right tabular-nums ${ligne.pct <= 100 ? "text-emerald-700" : "text-red-700"}`}>
            {Math.round(ligne.pct)}%
          </td>
        </tr>
      ))}
      <tr className="border-b border-border bg-muted/20 font-semibold">
        <td className="p-2">{section.sousTotal.poste}</td>
        <td className="p-2 text-right tabular-nums">{formatFCFA(section.sousTotal.previs, false)}</td>
        <td className="p-2 text-right tabular-nums">{formatFCFA(section.sousTotal.reel, false)}</td>
        <td className={`p-2 text-right tabular-nums ${section.sousTotal.ecart >= 0 ? "text-emerald-700" : "text-red-700"}`}>
          {section.sousTotal.ecart >= 0 ? "+" : "−"} {formatFCFA(Math.abs(section.sousTotal.ecart), false)}
        </td>
        <td className={`p-2 text-right tabular-nums ${section.sousTotal.pct <= 100 ? "text-emerald-700" : "text-red-700"}`}>
          {Math.round(section.sousTotal.pct)}%
        </td>
      </tr>
    </>
  );
}

// ---- Section D : Dépenses d'investissement ----
function InvestissementsTable({ investissements }: { investissements: { id: string; date: string; libelle: string; categorie: string; montant: number }[] }) {
  const total = investissements.reduce((s, i) => s + i.montant, 0);
  if (investissements.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-xs text-muted-foreground">
        <HugeiconsIcon icon={Plus} size={14} /> Aucune dépense d'investissement enregistrée.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[640px]">
        <thead className="bg-muted/60">
          <tr className="border-b-2 border-border text-left">
            <th className="p-2 font-medium">Date</th>
            <th className="p-2 font-medium">Libellé</th>
            <th className="p-2 font-medium">Catégorie</th>
            <th className="p-2 font-medium text-right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {investissements.map((inv) => (
            <tr key={inv.id} className="border-b border-border/40 hover:bg-muted/30">
              <td className="p-2 tabular-nums">{inv.date}</td>
              <td className="p-2 text-foreground">{inv.libelle}</td>
              <td className="p-2">
                <Badge variant="outline" className="text-[0.6rem] text-primary border-primary/30 bg-primary/5">
                  {inv.categorie}
                </Badge>
              </td>
              <td className="p-2 text-right tabular-nums font-medium text-red-600">{formatFCFA(inv.montant, false)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border font-bold bg-muted/30">
            <td className="p-2" colSpan={3}>Total</td>
            <td className="p-2 text-right tabular-nums text-red-600">{formatFCFA(total, false)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
