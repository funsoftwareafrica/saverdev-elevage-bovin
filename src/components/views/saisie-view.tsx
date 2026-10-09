"use client";
/* eslint-disable react-hooks/set-state-in-effect */

// Vue Saisie — journaux comptables (partie double) + balance + financement.
// Refonte complète avec :
// - Journal achat (Date, N° compte, Libellé, Débit, Crédit)
// - Journal vente (même structure)
// - Balance (somme débit - somme crédit + conclusion)
// - Financement (14 775 000 avec soustractions achat + ajouts vente en cascade)

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Beef, ShoppingCart, Receipt, Package, Plus, AlertTriangle, ChevronDown, ChevronUp, Wifi, Scale, Landmark, Wallet } from "@/lib/icons";
import { formatFCFA, formatDate, severiteColor } from "@/lib/format";
import { addPendingEntry } from "@/lib/offline-db";
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
interface FinancementMvt {
  date: string;
  libelle: string;
  type: "achat" | "vente";
  montant: number;
  sens: "sortie" | "entree";
  soldeApres: number;
}
type SaisieType = "achat" | "vente" | "depense" | "stock";

const TYPE_CONFIG: Record<SaisieType, { label: string; icon: typeof Beef; color: string }> = {
  achat: { label: "Journal d'achats", icon: Beef, color: "#10B981" },
  vente: { label: "Journal de ventes", icon: ShoppingCart, color: "#14B8A6" },
  depense: { label: "Journal des dépenses", icon: Receipt, color: "#F59E0B" },
  stock: { label: "Gestion de stock", icon: Package, color: "#3B82F6" },
};

export function SaisieView() {
  const [activeType, setActiveType] = useState<SaisieType | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [solde, setSolde] = useState(0);
  const [conclusion, setConclusion] = useState("");

  // Données balance
  const [balance, setBalance] = useState<{ numCompte: string; totalDebit: number; totalCredit: number; solde: number; conclusion: string }[]>([]);
  const [showBalance, setShowBalance] = useState(false);

  // Données financement
  const [financement, setFinancement] = useState<{ financementInitial: number; totalAchats: number; totalVentes: number; soldeRestant: number; mouvements: FinancementMvt[] } | null>(null);
  const [showFinancement, setShowFinancement] = useState(false);

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

  const loadBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/saisie?type=balance");
      if (!res.ok) return;
      const data = await res.json();
      setBalance(data.balance || []);
    } catch { /* ignore */ }
  }, []);

  const loadFinancement = useCallback(async () => {
    try {
      const res = await fetch("/api/saisie?type=financement");
      if (!res.ok) return;
      const data = await res.json();
      setFinancement(data);
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
      loadBalance();
      loadFinancement();
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

          {/* Accès Balance et Financement */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button onClick={() => { setShowBalance(true); loadBalance(); }}
              className="flex items-center gap-2 rounded-lg border border-border bg-white p-3 text-xs font-medium hover:bg-muted/40">
              <HugeiconsIcon icon={Scale} size={18} className="text-primary" /> Balance comptable
            </button>
            <button onClick={() => { setShowFinancement(true); loadFinancement(); }}
              className="flex items-center gap-2 rounded-lg border border-border bg-white p-3 text-xs font-medium hover:bg-muted/40">
              <HugeiconsIcon icon={Landmark} size={18} className="text-primary" /> Suivi financement
            </button>
          </div>
        </div>
      )}

      {/* Modal Balance */}
      {showBalance && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><HugeiconsIcon icon={Scale} size={16} className="text-primary" /> Balance comptable</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border text-left">
                  <th className="p-2">N° Compte</th><th className="p-2 text-right">Total Débit</th><th className="p-2 text-right">Total Crédit</th><th className="p-2 text-right">Solde</th><th className="p-2">Conclusion</th>
                </tr></thead>
                <tbody>
                  {balance.map((c, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-2 font-mono font-bold">{c.numCompte}</td>
                      <td className="p-2 text-right tabular-nums text-red-600">{formatFCFA(c.totalDebit, false)}</td>
                      <td className="p-2 text-right tabular-nums text-emerald-600">{formatFCFA(c.totalCredit, false)}</td>
                      <td className="p-2 text-right tabular-nums font-bold">{formatFCFA(Math.abs(c.solde), false)}</td>
                      <td className="p-2"><Badge variant="outline" className={c.solde > 0 ? "text-red-700 border-red-300 bg-red-50" : "text-emerald-700 border-emerald-300 bg-emerald-50"}>{c.conclusion}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setShowBalance(false)} className="mt-3 text-xs text-muted-foreground hover:text-foreground">← Fermer</button>
          </CardContent>
        </Card>
      )}

      {/* Modal Financement en cascade */}
      {showFinancement && financement && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><HugeiconsIcon icon={Landmark} size={16} className="text-primary" /> Suivi financement</CardTitle>
            <CardDescription className="text-xs">Capital initial : {formatFCFA(financement.financementInitial)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Résumé */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-center">
                <p className="text-[0.6rem] uppercase text-red-700 font-medium">Achats (sorties)</p>
                <p className="text-sm font-bold text-red-700 tabular-nums">{formatFCFA(financement.totalAchats, false)}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-center">
                <p className="text-[0.6rem] uppercase text-emerald-700 font-medium">Ventes (entrées)</p>
                <p className="text-sm font-bold text-emerald-700 tabular-nums">{formatFCFA(financement.totalVentes, false)}</p>
              </div>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-2 text-center">
                <p className="text-[0.6rem] uppercase text-primary font-medium">Solde restant</p>
                <p className="text-sm font-bold text-primary tabular-nums">{formatFCFA(financement.soldeRestant, false)}</p>
              </div>
            </div>

            {/* Mouvements en cascade */}
            <div className="space-y-0">
              <AnimatePresence mode="popLayout">
                {financement.mouvements.map((m, i) => (
                  <motion.div
                    key={`${m.date}-${i}`}
                    layout
                    initial={{ opacity: 0, x: -30, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto", marginLeft: Math.max(0, 16 - i * 3) }}
                    exit={{ opacity: 0, x: -30, height: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className={`relative overflow-hidden rounded-lg border p-3 ${m.sens === "sortie" ? "border-red-200 bg-red-50/30" : "border-emerald-200 bg-emerald-50/30"}`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${m.sens === "sortie" ? "bg-red-500" : "bg-emerald-500"}`} />
                    <div className="flex items-center justify-between gap-2 pl-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{m.libelle}</p>
                        <p className="text-[0.6rem] text-muted-foreground">{m.date} · {m.sens === "sortie" ? "Achat (sortie)" : "Vente (entrée)"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold tabular-nums ${m.sens === "sortie" ? "text-red-600" : "text-emerald-600"}`}>
                          {m.sens === "sortie" ? "−" : "+"} {formatFCFA(m.montant, false)}
                        </p>
                        <p className="text-[0.55rem] text-muted-foreground">Solde : {formatFCFA(m.soldeApres, false)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {financement.mouvements.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">Aucun mouvement</p>
              )}
            </div>

            <button onClick={() => setShowFinancement(false)} className="text-xs text-muted-foreground hover:text-foreground">← Fermer</button>
          </CardContent>
        </Card>
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

          {/* Journal comptable */}
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

            {loading ? (
              <p className="text-center text-xs text-muted-foreground py-4">Chargement...</p>
            ) : entries.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">Aucune entrée</p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {entries.map((e, i) => (
                    <motion.div
                      key={e.id}
                      layout
                      initial={{ opacity: 0, x: -30, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto", marginLeft: Math.max(0, 16 - i * 3) }}
                      exit={{ opacity: 0, x: -30, height: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3 }}
                      className={`relative overflow-hidden rounded-lg border p-3 ${e.debit > 0 ? "border-red-200 bg-red-50/20" : "border-emerald-200 bg-emerald-50/20"}`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${e.debit > 0 ? "bg-red-500" : "bg-emerald-500"}`} />
                      <div className="flex items-center justify-between gap-2 pl-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[0.6rem] font-mono font-bold bg-muted px-1.5 py-0.5 rounded">{e.numCompte}</span>
                            <p className="text-sm font-medium text-foreground truncate">{e.libelle}</p>
                          </div>
                          <p className="text-[0.6rem] text-muted-foreground mt-0.5">Date : {e.date}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {e.debit > 0 && <p className="text-sm font-bold tabular-nums text-red-600">MD : {formatFCFA(e.debit, false)}</p>}
                          {e.credit > 0 && <p className="text-sm font-bold tabular-nums text-emerald-600">MC : {formatFCFA(e.credit, false)}</p>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Totaux du journal */}
            {entries.length > 0 && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 border border-border p-2.5">
                <div className="flex gap-4 text-xs">
                  <span className="text-muted-foreground">Total Débit : <span className="font-bold text-red-600 tabular-nums">{formatFCFA(totalDebit, false)}</span></span>
                  <span className="text-muted-foreground">Total Crédit : <span className="font-bold text-emerald-600 tabular-nums">{formatFCFA(totalCredit, false)}</span></span>
                </div>
                <Badge variant="outline" className={solde > 0 ? "text-red-700 border-red-300 bg-red-50" : "text-emerald-700 border-emerald-300 bg-emerald-50"}>
                  {conclusion}
                </Badge>
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
    await onSave("achat", { date, race, nbSujets, prixUnitaire, poids, observations });
    setSaving(false);
    setPrixUnitaire(""); setPoids(""); setObservations("");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 text-sm" /></div>
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
  const [acheteur, setAcheteur] = useState("");
  const [nbSujets, setNbSujets] = useState("1");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);
  const montant = Number(prixUnitaire || 0) * Number(nbSujets || 0);

  const submit = async () => {
    if (!acheteur || !prixUnitaire) { toast.error("Acheteur et prix requis"); return; }
    setSaving(true);
    await onSave("vente", { date, acheteur, nbSujets, prixUnitaire, observations });
    setSaving(false);
    setAcheteur(""); setPrixUnitaire(""); setObservations("");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 text-sm" /></div>
        <div><Label className="text-xs">Acheteur</Label><Input value={acheteur} onChange={(e) => setAcheteur(e.target.value)} placeholder="Nom du client" className="h-11 text-sm" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Nb sujets vendus</Label><Input type="number" value={nbSujets} onChange={(e) => setNbSujets(e.target.value)} className="h-11 text-sm" min="1" /></div>
        <div><Label className="text-xs">Prix unit. (FCFA)</Label><Input type="number" value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} className="h-11 text-sm" placeholder="450000" /></div>
      </div>
      {montant > 0 && <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm"><span className="text-muted-foreground">Débit (4111) / Crédit (7011) : </span><span className="font-bold text-emerald-600">{formatFCFA(montant)}</span></div>}
      <div><Label className="text-xs">Observations</Label><Textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Conditions..." className="text-sm min-h-[60px]" /></div>
      <Button onClick={submit} disabled={saving} className="w-full h-12 text-sm bg-primary">{saving ? "Enregistrement..." : <><HugeiconsIcon icon={Plus} size={16} /> Enregistrer la vente</>}</Button>
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
