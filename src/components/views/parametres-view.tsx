"use client";
import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewHeader } from "./_shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useParams, useUpdateParam, useUsers, useCreateUser, useUpdateUser, useDeleteUser, type UserItem } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { Settings, Check, Lock, CalendarClock, UserPlus, Pencil, Trash } from "@/lib/icons";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

interface MoisClotureItem {
  id: string;
  mois: string;          // "YYYY-MM"
  cloture: boolean;
  cloturePar: string | null;
  dateCloture: string | null;
}

// Labels courts des mois en français (pour l'affichage UI).
const MOIS_LABELS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];

/** Convertit "2025-10" en "Oct. 2025" (ou renvoie la chaîne brute si échec). */
function formatMoisLabel(mois: string): string {
  const [y, m] = mois.split("-");
  const idx = parseInt(m, 10) - 1;
  if (idx < 0 || idx > 11) return mois;
  return `${MOIS_LABELS[idx]} ${y}`;
}

export function ParametresView() {
  const { data: params, isLoading } = useParams();
  const updateParam = useUpdateParam();
  const [values, setValues] = useState<Record<string, string>>({});
  const list = params ?? [];
  const role = useAppStore((s) => s.role);

  // ===== Task 31-B : gestion des mois clôturés =====
  const [moisClotures, setMoisClotures] = useState<MoisClotureItem[]>([]);
  const [loadingMois, setLoadingMois] = useState(true);
  const [selectedMonthInput, setSelectedMonthInput] = useState<string>("");
  const [savingMois, setSavingMois] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const v: Record<string, string> = {}; list.forEach((p) => { v[p.cle] = p.valeur; }); setValues(v); }, [list]);

  const loadMoisClotures = async () => {
    setLoadingMois(true);
    try {
      const res = await fetch("/api/mois-cloture", { cache: "no-store", credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMoisClotures(data.mois || []);
    } catch { /* ignore */ }
    setLoadingMois(false);
  };

  // Task 31-B : charge la liste des mois clôturés au montage du composant.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMois(true);
      try {
        const res = await fetch("/api/mois-cloture", { cache: "no-store", credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setMoisClotures(data.mois || []);
      } catch { /* ignore */ }
      if (!cancelled) setLoadingMois(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Soumet la clôture/déclôture d'un mois (réservé E2A).
  const handleToggleCloture = async (mois: string, cloture: boolean) => {
    setSavingMois(true);
    try {
      const res = await fetch("/api/mois-cloture", {
        method: cloture ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: cloture ? undefined : JSON.stringify({ mois }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || `Erreur HTTP ${res.status}`);
        return;
      }
      toast.success(cloture ? "Mois déclôturé" : "Mois clôturé");
      await loadMoisClotures();
    } catch {
      toast.error("Connexion perdue");
    }
    setSavingMois(false);
  };

  const handleClotureInput = async () => {
    const mois = selectedMonthInput; // déjà au format "YYYY-MM"
    if (!mois) {
      toast.error("Sélectionner un mois");
      return;
    }
    await handleToggleCloture(mois, false);
    setSelectedMonthInput("");
  };

  // Seul E2A peut voir/gérer la section clôture des mois.
  const canManageCloture = role === "E2A";

  return (
    <div className="space-y-6">
      <ViewHeader title="Paramètres & seuils" description="Configurez les seuils d'alerte et la clôture des mois comptables" icon={Settings} />
      {isLoading ? <Skeleton className="h-48" /> : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Seuils d'alerte</CardTitle>
            <CardDescription className="text-xs">Ajustez les seuils déclenchant les alertes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {list.map((p) => (
              <div key={p.id} className="flex items-center gap-3 border-b pb-3 last:border-0">
                <div className="flex-1"><p className="text-sm font-medium">{p.description ?? p.cle}</p></div>
                <Input value={values[p.cle] ?? ""} onChange={(e) => setValues({ ...values, [p.cle]: e.target.value })} className="w-32 h-8 text-sm" />
                <Button size="sm" variant="ghost" onClick={() => updateParam.mutate({ cle: p.cle, valeur: values[p.cle] ?? "" }, { onSuccess: () => toast.success("Paramètre mis à jour") })}>
                  <HugeiconsIcon icon={Check} size={16} />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ===== Task 31-B : Gestion des mois clôturés (verrouillage comptable) ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <HugeiconsIcon icon={CalendarClock} size={16} className="text-primary" /> Clôture des mois comptables
          </CardTitle>
          <CardDescription className="text-xs">
            Verrouillez les saisies sur un mois clos. Tant qu'un mois est clôturé, POST /api/saisie répondra HTTP 403 « Mois clôturé, saisie impossible ».
            {!canManageCloture && " (réservé au rôle E2A)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulaire de clôture d'un nouveau mois */}
          {canManageCloture && (
            <div className="flex items-end gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex-1 space-y-1">
                <label className="text-xs uppercase text-muted-foreground">Clôturer un mois</label>
                <Input
                  type="month"
                  value={selectedMonthInput}
                  onChange={(e) => setSelectedMonthInput(e.target.value)}
                  className="h-9 text-sm"
                  disabled={savingMois}
                />
              </div>
              <Button
                onClick={handleClotureInput}
                disabled={savingMois || !selectedMonthInput}
                size="sm"
                className="bg-primary"
              >
                <HugeiconsIcon icon={Lock} size={14} /> Clôturer
              </Button>
            </div>
          )}

          {/* Liste des mois clôturés/ouverts */}
          {loadingMois ? (
            <Skeleton className="h-24" />
          ) : moisClotures.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
              Aucun mois clôturé pour le moment.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {moisClotures.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{formatMoisLabel(m.mois)}</p>
                    <p className="text-[0.65rem] text-muted-foreground">
                      {m.cloturePar ? `Clôturé par ${m.cloturePar}` : "N/A"}
                      {m.dateCloture ? ` · ${new Date(m.dateCloture).toLocaleString("fr-FR")}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={m.cloture
                      ? "text-emerald-700 border-emerald-300 bg-emerald-50"
                      : "text-amber-700 border-amber-300 bg-amber-50"}
                  >
                    {m.cloture ? "Clôturé" : "Ouvert"}
                  </Badge>
                  {canManageCloture && (
                    <Button
                      size="sm"
                      variant={m.cloture ? "outline" : "default"}
                      onClick={() => handleToggleCloture(m.mois, m.cloture)}
                      disabled={savingMois}
                      className="h-8"
                    >
                      {m.cloture ? "Déclôturer" : "Clôturer"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Légende informative */}
          <p className="text-[0.65rem] text-muted-foreground italic">
            Astuce : un mois clôturé empêche toute nouvelle saisie (achats, ventes, dépenses, stock, investissement, capital). La déclôture rouvre le mois — utile pour des corrections post-clôture.
          </p>
        </CardContent>
      </Card>

      {/* ===== Gestion des utilisateurs (E2A only) ===== */}
      {role === "E2A" && <UserManagementSection />}
    </div>
  );
}

// ===== Section Gestion des Utilisateurs (E2A only) =====
function UserManagementSection() {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("BENEFICIAIRE");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const list = users ?? [];

  const roleColor = (r: string) => r === "E2A" ? "text-red-700 bg-red-50 border-red-200" : r === "SINERGI" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-200";

  const handleAdd = async () => {
    if (!newEmail || !newName || !newPassword) { toast.error("Tous les champs requis"); return; }
    setSaving(true);
    createUser.mutate({ email: newEmail, name: newName, role: newRole, password: newPassword }, {
      onSuccess: () => { toast.success("Utilisateur créé"); setShowAdd(false); setNewEmail(""); setNewName(""); setNewPassword(""); setNewRole("BENEFICIAIRE"); },
      onError: (e: Error) => toast.error(e.message),
      onSettled: () => setSaving(false),
    });
  };

  const handleEdit = async (data: { email?: string; name?: string; role?: string; password?: string }) => {
    if (!editTarget) return;
    setSaving(true);
    updateUser.mutate({ id: editTarget.id, ...data }, {
      onSuccess: () => { toast.success("Utilisateur modifié"); setEditTarget(null); },
      onError: (e: Error) => toast.error(e.message),
      onSettled: () => setSaving(false),
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success("Utilisateur supprimé"); setDeleteTarget(null); },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2"><HugeiconsIcon icon={UserPlus} size={16} className="text-primary" /> Gestion des utilisateurs</CardTitle>
        <CardDescription className="text-xs">Créer, modifier ou supprimer des comptes (réservé E2A)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-end">
          <Button size="sm" className="bg-primary" onClick={() => setShowAdd(true)}><HugeiconsIcon icon={UserPlus} size={14} /> Ajouter un utilisateur</Button>
        </div>

        {isLoading ? <Skeleton className="h-32" /> : list.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Aucun utilisateur</p>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="hidden sm:table-cell">Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs font-mono">{u.email}</TableCell>
                    <TableCell className="text-xs">{u.name}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[0.6rem] ${roleColor(u.role)}`}>{u.role}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTarget(u)} title="Modifier"><HugeiconsIcon icon={Pencil} size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => setDeleteTarget(u)} title="Supprimer"><HugeiconsIcon icon={Trash} size={12} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog Ajouter */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Nouvel utilisateur</DialogTitle><DialogDescription className="text-xs">Tous les champs sont requis.</DialogDescription></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Email</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@saverdev.org" /></div>
              <div><Label className="text-xs">Nom complet</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ibrahim Sawadogo" /></div>
              <div><Label className="text-xs">Rôle</Label><Select value={newRole} onValueChange={setNewRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BENEFICIAIRE">Bénéficiaire (saisie)</SelectItem><SelectItem value="SINERGI">SINERGI (lecture seule)</SelectItem><SelectItem value="E2A">E2A (admin)</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Mot de passe (min 6)</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" /></div>
            </div>
            <DialogFooter><Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Annuler</Button><Button size="sm" className="bg-primary" disabled={saving} onClick={handleAdd}>{saving ? "..." : "Créer"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Modifier */}
        {editTarget && <EditUserDialog user={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} saving={saving} />}

        {/* AlertDialog Supprimer */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle><AlertDialogDescription>{deleteTarget?.email} sera supprimé définitivement. Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// Dialog de modification d'un user
function EditUserDialog({ user, onClose, onSave, saving }: { user: UserItem; onClose: () => void; onSave: (data: { email?: string; name?: string; role?: string; password?: string }) => void; saving: boolean }) {
  const [email, setEmail] = useState(user.email);
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState("");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Modifier l'utilisateur</DialogTitle><DialogDescription className="text-xs">{user.email} — laissez le mot de passe vide pour ne pas le changer.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label className="text-xs">Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label className="text-xs">Rôle</Label><Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BENEFICIAIRE">Bénéficiaire</SelectItem><SelectItem value="SINERGI">SINERGI</SelectItem><SelectItem value="E2A">E2A</SelectItem></SelectContent></Select></div>
          <div><Label className="text-xs">Nouveau mot de passe (optionnel)</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer" /></div>
        </div>
        <DialogFooter><Button variant="ghost" size="sm" onClick={onClose}>Annuler</Button><Button size="sm" className="bg-primary" disabled={saving} onClick={() => onSave({ email, name, role, ...(password ? { password } : {}) })}>{saving ? "..." : "Enregistrer"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
