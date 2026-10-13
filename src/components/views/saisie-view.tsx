"use client";
/* eslint-disable react-hooks/set-state-in-effect */

// Vue Saisie — journaux comptables (partie double).
// Vue Task 29 : uniquement les 4 journaux (Achats / Ventes / Dépenses / Stock)
// + la zone d'alertes. La balance comptable et le suivi du financement ont été
// déplacés vers le rapport bailleur (cf. rapport-bailleur-view).

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Beef, ShoppingCart, Receipt, Package, Plus, AlertTriangle,
  ChevronDown, ChevronUp, Wifi,
} from "@/lib/icons";
import { formatFCFA, severiteColor } from "@/lib/format";
import { addPendingEntry } from "@/lib/offline-db";
import { useAppStore } from "@/lib/store";
import { useBovins } from "@/lib/api";
import { toast } from "sonner";

interface JournalEntry {
  id: string;
  date: string;
  numCompte: string;
  libelle: string;
  debit: number;
  credit: number;
}
interface Alerte { type: string; severite: string; message: string; }
type SaisieType = "achat" | "vente" | "depense" | "stock";

const TYPE_CONFIG: Record<SaisieType, { label: string; icon: typeof Beef; color: string }> = {
  achat: { label: "Journal d'achats", icon: Beef, color: "#10B981" },
  vente: { label: "Journal de ventes", icon: ShoppingCart, color: "#14B8A6" },
  depense: { label: "Journal des dépenses", icon: Receipt, color: "#F59E0B" },
  stock: { label: "Gestion de stock", icon: Package, color: "#3B82F6" },
};

export function SaisieView() {
  // Permet à la sidebar de pointer vers cette vue en présélectionnant un type
  // (ex: bouton "Achats" → saisieInitialType = "achat")
  const saisieInitialType = useAppStore((s) => s.saisieInitialType);
  const setSaisieInitialType = useAppStore((s) => s.setSaisieInitialType);

  const [activeType, setActiveType] = useState<SaisieType | null>(
    saisieInitialType ?? null
  );
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [solde, setSolde] = useState(0);
  const [conclusion, setConclusion] = useState("");

  const loadJournal = useCallback(async (t: SaisieType) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/saisie?type=${t}`);
      if (!res.ok) return;
      const data = await res.json();
      setEntries(data.entries || []);
      setTotalDebit(data.totalDebit || 0);
      setTotalCredit(data.totalCredit || 0);
      setSolde(data.solde || 0);
      setConclusion(data.conclusion || "");
    } catch { /* hors ligne */ }
    setLoading(false);
  }, []);

  const loadAlertes = useCallback(async () => {
    try {
      const res = await fetch("/api/saisie?type=alertes");
      if (!res.ok) return;
      const data = await res.json();
      setAlertes(data.alertes || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const handleOnlineChange = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnlineChange);
    window.addEventListener("offline", handleOnlineChange);
    loadAlertes();
    return () => {
      window.removeEventListener("online", handleOnlineChange);
      window.removeEventListener("offline", handleOnlineChange);
    };
  }, []);

  useEffect(() => {
    // Si la sidebar a présélectionné un type (ex: bouton "Achats" → "achat"),
    // on l'applique et on le consomme pour ne pas polluer la prochaine ouverture
    // manuelle de la vue Saisie.
    if (saisieInitialType) {
      setActiveType(saisieInitialType);
      setSaisieInitialType(null);
    }
  }, [saisieInitialType, setSaisieInitialType]);

  useEffect(() => {
    if (activeType) {
      loadJournal(activeType);
    }
  }, [activeType]);

  const handleSave = async (type: SaisieType, data: Record<string, unknown>) => {
    if (!navigator.onLine) {
      await addPendingEntry(type, data);
      toast.success("Saisie enregistrée hors ligne");
      return;
    }
    try {
      const res = await fetch("/api/saisie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Erreur");
        return;
      }
      toast.success("Saisie enregistrée");
      if (activeType) loadJournal(activeType);
      loadAlertes();
    } catch {
      await addPendingEntry(type, data);
      toast.warning("Connexion perdue — sauvegardé hors ligne");
    }
  };

  return (
    <div className="space-y-4">
      {/* Zone d'alertes */}
      {alertes.length > 0 && (
        <Card className="border-amber-200">
          <button onClick={() => setShowAlerts((v) => !v)} className="w-full flex items-center gap-2 p-3">
            <HugeiconsIcon icon={AlertTriangle} size={16} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-900 flex-1 text-left">Zone d'alertes ({alertes.length})</span>
            {showAlerts ? <HugeiconsIcon icon={ChevronUp} size={16} className="text-amber-600" /> : <HugeiconsIcon icon={ChevronDown} size={16} className="text-amber-600" />}
          </button>
          {showAlerts && (
            <div className="px-3 pb-3 space-y-1.5">
              {alertes.map((a, i) => (
                <div key={i} className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs ${severiteColor(a.severite)}`}>
                  <span className="font-medium flex-1">{a.message}</span>
                  <span className="text-[0.55rem] uppercase font-bold shrink-0">{a.type}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Sélecteur de type */}
      {!activeType && (
        <div className="space-y-3">
          <div className="text-center">
            <h2 className="text-lg font-bold text-foreground">Que voulez-vous saisir ?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Choisissez un type d'opération</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(TYPE_CONFIG) as SaisieType[]).map((t) => {
              const cfg = TYPE_CONFIG[t];
              return (
                <motion.button key={t} whileTap={{ scale: 0.95 }} onClick={() => setActiveType(t)}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-colors hover:bg-muted/40"
                  style={{ borderColor: cfg.color + "40" }}>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ background: cfg.color + "15" }}>
                    <HugeiconsIcon icon={cfg.icon} size={24} style={{ color: cfg.color }} />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{cfg.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulaire + Journal quand un type est sélectionné */}
      {activeType && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => { setActiveType(null); setEntries([]); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <HugeiconsIcon icon={ChevronDown} size={14} className="rotate-90" /> Retour
            </button>
            <div className="flex items-center gap-2 flex-1">
              <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: TYPE_CONFIG[activeType].color + "15" }}>
                <HugeiconsIcon icon={TYPE_CONFIG[activeType].icon} size={16} style={{ color: TYPE_CONFIG[activeType].color }} />
              </div>
              <h2 className="text-base font-bold text-foreground">{TYPE_CONFIG[activeType].label}</h2>
            </div>
            <div className={`flex items-center gap-1 text-[0.6rem] ${isOnline ? "text-emerald-600" : "text-amber-600"}`}>
              <HugeiconsIcon icon={Wifi} size={12} />{isOnline ? "En ligne" : "Hors ligne"}
            </div>
          </div>

          {/* Formulaire */}
          <Card><CardContent className="p-4">
            {activeType === "achat" && <FormAchat onSave={handleSave} />}
            {activeType === "vente" && <FormVente onSave={handleSave} />}
            {activeType === "depense" && <FormDepense onSave={handleSave} />}
            {activeType === "stock" && <FormStock onSave={handleSave} />}
          </CardContent></Card>

          {/* Journal comptable — tableau en cascade */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">{TYPE_CONFIG[activeType].label}</h3>
              {entries.length > 0 && (
                <div className="text-right">
                  <span className="text-[0.6rem] text-muted-foreground">Solde : </span>
                  <span className={`text-xs font-bold tabular-nums ${solde > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {formatFCFA(Math.abs(solde), false)} · {conclusion}
                  </span>
                </div>
              )}
            </div>

            {/* En-tête du tableau */}
            <div className="grid grid-cols-[60px_60px_1fr_80px_80px] gap-2 px-3 py-1.5 border-b border-border text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Date</span>
              <span>N° Compte</span>
              <span>Libellé</span>
              <span className="text-right">Montant Débit</span>
              <span className="text-right">Montant Crédit</span>
            </div>

            {/* Lignes du journal en cascade */}
            {loading ? (
              <p className="text-center text-xs text-muted-foreground py-4">Chargement...</p>
            ) : entries.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">Aucune entrée</p>
            ) : (
              <div className="overflow-hidden">
                <AnimatePresence mode="popLayout">
                  {entries.map((e, i) => (
                    <motion.div
                      key={e.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                      className={`grid grid-cols-[60px_60px_1fr_80px_80px] gap-2 items-center px-3 py-1.5 border-b border-border/40 text-xs ${e.debit > 0 ? "bg-red-50/30" : "bg-emerald-50/30"}`}
                    >
                      <span className="text-muted-foreground tabular-nums">{e.date}</span>
                      <span className="font-mono font-bold text-foreground">{e.numCompte}</span>
                      <span className="text-foreground truncate">{e.libelle}</span>
                      <span className="text-right tabular-nums font-medium text-red-600">{e.debit > 0 ? formatFCFA(e.debit, false) : ""}</span>
                      <span className="text-right tabular-nums font-medium text-emerald-600">{e.credit > 0 ? formatFCFA(e.credit, false) : ""}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Totaux du journal */}
            {entries.length > 0 && (
              <div className="grid grid-cols-[60px_60px_1fr_80px_80px] gap-2 items-center px-3 py-2 bg-muted/40 border border-border rounded-b-lg text-xs font-bold">
                <span></span>
                <span></span>
                <span className="text-muted-foreground">Total</span>
                <span className="text-right tabular-nums text-red-600">{formatFCFA(totalDebit, false)}</span>
                <span className="text-right tabular-nums text-emerald-600">{formatFCFA(totalCredit, false)}</span>
              </div>
            )}

            {/* Conclusion */}
            {entries.length > 0 && (
              <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-xs text-muted-foreground">Solde (Débit − Crédit)</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold tabular-nums ${solde > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {formatFCFA(Math.abs(solde), false)}
                  </span>
                  <Badge variant="outline" className={solde > 0 ? "text-red-700 border-red-300 bg-red-50" : "text-emerald-700 border-emerald-300 bg-emerald-50"}>
                    {conclusion}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//   FORMULAIRES
// ============================================================

function FormAchat({ onSave }: { onSave: (type: SaisieType, data: Record<string, unknown>) => Promise<void> }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [espece, setEspece] = useState("BOVIN");
  const [gestionnaire, setGestionnaire] = useState("SAVERDEV");
  const [race, setRace] = useState("Zébu");
  const [nbSujets, setNbSujets] = useState("1");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [poids, setPoids] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);
  const montant = Number(prixUnitaire || 0) * Number(nbSujets || 0);

  const submit = async () => {
    if (!prixUnitaire) { toast.error("Prix requis"); return; }
    setSaving(true);
    await onSave("achat", { date, espece, gestionnaire, race, nbSujets, prixUnitaire, poids, observations });
    setSaving(false);
    setPrixUnitaire(""); setPoids(""); setObservations("");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 text-sm" /></div>
        <div>
          <Label className="text-xs">Gestionnaire</Label>
          <Select value={gestionnaire} onValueChange={setGestionnaire}>
            <SelectTrigger className="h-11 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SAVERDEV" className="text-sm">SAVERDEV (Souleymane Z.)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Espèce</Label>
          <Select value={espece} onValueChange={(v) => { setEspece(v); setRace(v === "BOVIN" ? "Zébu" : "Mouton Sokoto"); }}>
            <SelectTrigger className="h-11 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BOVIN" className="text-sm">Bovin (BOE)</SelectItem>
              <SelectItem value="OVIN" className="text-sm">Ovin (OVN)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Race</Label><Input value={race} onChange={(e) => setRace(e.target.value)} className="h-11 text-sm" /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs">Nb sujets</Label><Input type="number" value={nbSujets} onChange={(e) => setNbSujets(e.target.value)} className="h-11 text-sm" min="1" /></div>
        <div><Label className="text-xs">Prix unit. (FCFA)</Label><Input type="number" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} className="h-11 text-sm" placeholder="350000" /></div>
        <div><Label className="text-xs">Poids (kg)</Label><Input type="number" value={poids} onChange={(e) => setPoids(e.target.value)} className="h-11 text-sm" placeholder="280" /></div>
      </div>
      {montant > 0 && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm"><span className="text-muted-foreground">Débit (6011) / Crédit (5711) : </span><span className="font-bold text-red-600">{formatFCFA(montant)}</span></div>}
      <div><Label className="text-xs">Observations</Label><Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Marché, robe..." className="text-sm min-h-[60px]" /></div>
      <Button onClick={submit} disabled={saving} className="w-full h-12 text-sm bg-primary">{saving ? "Enregistrement..." : <><HugeiconsIcon icon={Plus} size={16} /> Enregistrer l'achat</>}</Button>
    </div>
  );
}

function FormVente({ onSave }: { onSave: (type: SaisieType, data: Record<string, unknown>) => Promise<void> }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [espece, setEspece] = useState<"BOVIN" | "OVIN">("BOVIN");
  const [bovinId, setBovinId] = useState<string>("");
  const [acheteur, setAcheteur] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);

  // Charge la liste des animaux en engraissement filtrés par espèce.
  const { data: allBovins, isLoading } = useBovins();
  const actifs = (allBovins ?? []).filter(
    (b) => b.statut === "EN_ENGRAISSEMENT" && b.espece === espece
  );

  // Quand l'espèce change, on réinitialise l'animal sélectionné car
  // les identifiants de la liste précédente ne sont plus pertinents.
  const onEspeceChange = (v: string) => {
    setEspece(v as "BOVIN" | "OVIN");
    setBovinId("");
  };

  // Comme on sélectionne un animal précis, le nb de sujets vaut 1.
  const nbSujets = 1;
  const montant = Number(prixUnitaire || 0) * nbSujets;

  // Animal sélectionné (pour réafficher son coût de revient).
  const selected = actifs.find((b) => b.id === bovinId) ?? null;

  const submit = async () => {
    if (!bovinId) { toast.error("Sélectionner un animal à vendre"); return; }
    if (!acheteur || !prixUnitaire) { toast.error("Acheteur et prix requis"); return; }
    setSaving(true);
    await onSave("vente", { date, espece, bovinId, acheteur, nbSujets, prixUnitaire, observations });
    setSaving(false);
    setBovinId(""); setAcheteur(""); setPrixUnitaire(""); setObservations("");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 text-sm" /></div>
        <div>
          <Label className="text-xs">Espèce</Label>
          <Select value={espece} onValueChange={onEspeceChange}>
            <SelectTrigger className="h-11 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BOVIN" className="text-sm">Bovin (BOE)</SelectItem>
              <SelectItem value="OVIN" className="text-sm">Ovin (OVN)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Animal à vendre</Label>
        {isLoading ? (
          <div className="h-11 rounded-md border border-input bg-muted/40 animate-pulse" />
        ) : actifs.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center gap-2">
            <HugeiconsIcon icon={AlertTriangle} size={14} className="text-amber-600" />
            Aucun {espece === "OVIN" ? "Ovin" : "Bovin"} disponible à la vente
          </div>
        ) : (
          <Select value={bovinId} onValueChange={setBovinId}>
            <SelectTrigger className="h-11 text-sm"><SelectValue placeholder={`Sélectionner un ${espece === "OVIN" ? "ovin" : "bovin"} actif`} /></SelectTrigger>
            <SelectContent>
              {actifs.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-sm">
                  {b.identifiant} — {b.race} (coût revient {formatFCFA(b.prixAchat + b.coutsEngraissement, false)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Acheteur</Label><Input value={acheteur} onChange={(e) => setAcheteur(e.target.value)} placeholder="Nom du client" className="h-11 text-sm" /></div>
        <div><Label className="text-xs">Prix unit. (FCFA)</Label><Input type="number" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} className="h-11 text-sm" placeholder="450000" /></div>
      </div>
      {selected && (
        <div className="rounded-md bg-muted/60 border border-border px-3 py-2 text-xs text-muted-foreground">
          Coût de revient {selected.identifiant} : <span className="font-semibold text-foreground">{formatFCFA(selected.prixAchat + selected.coutsEngraissement, false)}</span>
        </div>
      )}
      {montant > 0 && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm"><span className="text-muted-foreground">Débit (4111) / Crédit (7011) : </span><span className="font-bold text-emerald-600">{formatFCFA(montant)}</span></div>}
      <div><Label className="text-xs">Observations</Label><Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Conditions..." className="text-sm min-h-[60px]" /></div>
      <Button onClick={submit} disabled={saving || !bovinId} className="w-full h-12 text-sm bg-primary">{saving ? "Enregistrement..." : <><HugeiconsIcon icon={Plus} size={16} /> Enregistrer la vente</>}</Button>
    </div>
  );
}

function FormDepense({ onSave }: { onSave: (type: SaisieType, data: Record<string, unknown>) => Promise<void> }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categorie, setCategorie] = useState("Vétérinaire");
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!libelle || !montant) { toast.error("Libellé et montant requis"); return; }
    setSaving(true);
    await onSave("depense", { date, categorie, libelle, montant, observations });
    setSaving(false);
    setLibelle(""); setMontant(""); setObservations("");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 text-sm" /></div>
        <div><Label className="text-xs">Catégorie</Label>
          <Select value={categorie} onValueChange={setCategorie}><SelectTrigger className="h-11 text-sm"><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="Vétérinaire" className="text-sm">Vétérinaire</SelectItem>
            <SelectItem value="Salariat" className="text-sm">Salariat</SelectItem>
            <SelectItem value="Immobilisation" className="text-sm">Immobilisation</SelectItem>
            <SelectItem value="Aliment bétail" className="text-sm">Aliment bétail</SelectItem>
            <SelectItem value="Transport" className="text-sm">Transport</SelectItem>
            <SelectItem value="Autre" className="text-sm">Autre</SelectItem>
          </SelectContent></Select>
        </div>
      </div>
      <div><Label className="text-xs">Libellé</Label><Input value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Description" className="h-11 text-sm" /></div>
      <div><Label className="text-xs">Montant (FCFA)</Label><Input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} className="h-11 text-sm" placeholder="50000" /></div>
      {montant && Number(montant) > 0 && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm"><span className="text-muted-foreground">Débit : </span><span className="font-bold text-red-600">{formatFCFA(Number(montant))}</span></div>}
      <div><Label className="text-xs">Observations</Label><Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Remarques..." className="text-sm min-h-[60px]" /></div>
      <Button onClick={submit} disabled={saving} className="w-full h-12 text-sm bg-primary">{saving ? "Enregistrement..." : <><HugeiconsIcon icon={Plus} size={16} /> Enregistrer la dépense</>}</Button>
    </div>
  );
}

function FormStock({ onSave }: { onSave: (type: SaisieType, data: Record<string, unknown>) => Promise<void> }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [typeAliment, setTypeAliment] = useState("Tourteau de coton");
  const [entree, setEntree] = useState("");
  const [sortie, setSortie] = useState("");
  const [prixParSac, setPrixParSac] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!entree && !sortie) { toast.error("Saisir une entrée ou sortie"); return; }
    setSaving(true);
    await onSave("stock", { date, typeAliment, entree, sortie, prixParSac, observations });
    setSaving(false);
    setEntree(""); setSortie(""); setPrixParSac(""); setObservations("");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 text-sm" /></div>
        <div><Label className="text-xs">Type d'aliment</Label>
          <Select value={typeAliment} onValueChange={setTypeAliment}><SelectTrigger className="h-11 text-sm"><SelectValue /></SelectTrigger><SelectContent>
            <SelectItem value="Tourteau de coton" className="text-sm">Tourteau de coton</SelectItem>
            <SelectItem value="Son" className="text-sm">Son</SelectItem>
            <SelectItem value="Concentré" className="text-sm">Concentré</SelectItem>
            <SelectItem value="Autre" className="text-sm">Autre</SelectItem>
          </SelectContent></Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs">Entrée (sacs)</Label><Input type="number" value={entree} onChange={(e) => setEntree(e.target.value)} className="h-11 text-sm" placeholder="0" min="0" /></div>
        <div><Label className="text-xs">Sortie (sacs)</Label><Input type="number" value={sortie} onChange={(e) => setSortie(e.target.value)} className="h-11 text-sm" placeholder="0" min="0" /></div>
        <div><Label className="text-xs">Prix/sac</Label><Input type="number" value={prixParSac} onChange={(e) => setPrixParSac(e.target.value)} className="h-11 text-sm" placeholder="25000" /></div>
      </div>
      <div><Label className="text-xs">Observations</Label><Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Fournisseur..." className="text-sm min-h-[60px]" /></div>
      <Button onClick={submit} disabled={saving} className="w-full h-12 text-sm bg-primary">{saving ? "Enregistrement..." : <><HugeiconsIcon icon={Plus} size={16} /> Enregistrer le mouvement</>}</Button>
    </div>
  );
}
