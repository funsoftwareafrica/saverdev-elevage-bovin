// Pesées connectées — KPIs synthèse + bouton "Nouvelle pesée" (Modal form) +
// liste des pesées avec poids (emerald) + badge methode.
// Hooks : usePesees() + useBovins() + useCreatePese().
import * as React from "react";
import {
  ScrollView, View, Text, StyleSheet, RefreshControl,
  Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePesees, useBovins, useCreatePese } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { theme } from "@/constants/theme";
import { KpiCard } from "@/components/KpiCard";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { SectionTitle } from "@/components/Section";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { SaverdevLogo } from "@/components/SaverdevLogo";
import {
  Scale, Beef, TrendingUp, Plus, X, Check,
} from "lucide-react-native";
import { PESEE_METHODES } from "@/lib/types";
import type { Pese } from "@/lib/types";

// Couleurs badges méthode (Manuelle / Balance / Estimée)
function methodeColor(m: string): { bg: string; fg: string; border: string } {
  switch (m) {
    case "Balance":
      return { bg: "#ECFDF5", fg: "#059669", border: "#A7F3D0" };
    case "Estimée":
      return { bg: "#FFF7ED", fg: "#D97706", border: "#FED7AA" };
    case "Manuelle":
    default:
      return { bg: "#F0FDFA", fg: "#0F766E", border: "#A5F3FC" };
  }
}

export default function PeseesScreen() {
  const { data: pesees, isLoading, refetch, isRefetching } = usePesees();
  const { data: allBovins } = useBovins();
  const createMut = useCreatePese();
  const insets = useSafeAreaInsets();

  // Form state
  const [open, setOpen] = React.useState(false);
  const [bovinId, setBovinId] = React.useState<string | null>(null);
  const [poids, setPoids] = React.useState("");
  const [methode, setMethode] = React.useState<string>("Manuelle");

  const list: Pese[] = pesees ?? [];
  const nbPesees = list.length;
  const poidsMoyen = React.useMemo(
    () => (nbPesees > 0 ? list.reduce((s, p) => s + p.poids, 0) / nbPesees : 0),
    [list, nbPesees]
  );
  const nbBovinsPeses = React.useMemo(
    () => new Set(list.map((p) => p.bovinId)).size,
    [list]
  );

  // Bovins disponibles (EN_ENGRAISSEMENT uniquement — pas encore vendus)
  const bovinsActifs = React.useMemo(() => {
    const vendusIds = new Set((allBovins ?? []).filter((b) => b.statut === "VENDU").map((b) => b.id));
    return (allBovins ?? []).filter((b) => b.statut === "EN_ENGRAISSEMENT" && !vendusIds.has(b.id));
  }, [allBovins]);

  const resetForm = () => {
    setBovinId(null); setPoids(""); setMethode("Manuelle");
  };

  const canSubmit = bovinId !== null && poids !== "" && !createMut.isPending;

  const handleSubmit = () => {
    if (!canSubmit || !bovinId) return;
    const p = parseFloat(poids.replace(",", "."));
    if (isNaN(p) || p <= 0) {
      Alert.alert("Poids invalide", "Saisissez un poids numérique positif.");
      return;
    }
    createMut.mutate(
      { bovinId, poids: p, methode },
      {
        onSuccess: () => {
          Alert.alert("Succès", "Pesée enregistrée. Historique mis à jour.");
          resetForm();
          setOpen(false);
        },
        onError: () => Alert.alert("Erreur", "Échec de l'enregistrement de la pesée. Réessayez."),
      }
    );
  };

  if (isLoading || !pesees) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, gap: 16 }}
      >
        <Skeleton style={{ height: 60 }} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} style={{ flex: 1, height: 100, borderRadius: 12 }} />)}
        </View>
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} style={{ height: 90, borderRadius: 16 }} />)}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, paddingBottom: 100, gap: 16 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.colors.primary} />}
      keyboardShouldPersistTaps="handled"
    >
      {/* En-tête */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Pesées connectées</Text>
          <Text style={styles.subtitle}>{nbPesees} pesée(s) · {nbBovinsPeses} bovin(s) pesé(s)</Text>
        </View>
        <SaverdevLogo size={40} />
      </View>

      {/* KPIs */}
      <View style={styles.grid3}>
        <KpiCard label="Pesées" value={nbPesees} icon={Scale} variant="primary" />
        <KpiCard label="Poids moyen" value={`${Math.round(poidsMoyen)} kg`} icon={TrendingUp} />
        <KpiCard label="Bovins pesés" value={nbBovinsPeses} icon={Beef} variant="success" />
      </View>

      {/* Bouton nouvelle pesée */}
      <Button
        label="Nouvelle pesée"
        variant="primary"
        size="lg"
        icon={<Plus size={16} color={theme.colors.primaryFg} />}
        onPress={() => setOpen(true)}
        disabled={bovinsActifs.length === 0}
      />
      {bovinsActifs.length === 0 && (
        <Text style={styles.helperText}>Aucun bovin en engraissement disponible à la pesée.</Text>
      )}

      {/* Liste des pesées */}
      <View>
        <SectionTitle icon={Scale} title="Historique des pesées" subtitle={`${nbPesees} entrée(s)`} />
        <View style={{ gap: 8 }}>
          {list.map((p) => {
            const mc = methodeColor(p.methode);
            return (
              <View key={p.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.rowIcon}>
                    <Scale size={16} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowIdentifiant}>{p.identifiant}</Text>
                      <Badge label={p.methode} bg={mc.bg} fg={mc.fg} border={mc.border} size="md" />
                    </View>
                    <View style={styles.rowMeta}>
                      <Text style={styles.rowDate}>{formatDate(p.date)}</Text>
                      <Text style={styles.rowDot}>·</Text>
                      <Text style={styles.rowRace}>{p.race}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.rowPoids}>
                  <Text style={styles.rowPoidsValue}>{p.poids}</Text>
                  <Text style={styles.rowPoidsUnit}>kg</Text>
                </View>
              </View>
            );
          })}
          {list.length === 0 && (
            <Card><Text style={styles.empty}>Aucune pesée enregistrée pour le moment.</Text></Card>
          )}
        </View>
      </View>

      {/* Modal formulaire */}
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: 16 + insets.bottom }]}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Nouvelle pesée</Text>
                <Text style={styles.sheetSubtitle}>Bovin en engraissement</Text>
              </View>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <X size={20} color={theme.colors.muted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14 }} keyboardShouldPersistTaps="handled">
              {/* Picker bovin */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Bovin à peser</Text>
                {bovinsActifs.length === 0 ? (
                  <View style={styles.pickerEmpty}>
                    <Text style={styles.pickerEmptyText}>Aucun bovin en engraissement disponible.</Text>
                  </View>
                ) : (
                  <View style={styles.pickerList}>
                    {bovinsActifs.map((b) => {
                      const active = bovinId === b.id;
                      return (
                        <Pressable
                          key={b.id}
                          onPress={() => setBovinId(b.id)}
                          style={[styles.pickerItem, active && styles.pickerItemActive]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.pickerItemId, active && styles.pickerItemIdActive]}>{b.identifiant}</Text>
                            <Text style={styles.pickerItemMeta}>{b.race} · achat {b.poidsAchat} kg</Text>
                          </View>
                          {active ? (
                            <View style={styles.pickerItemCheck}>
                              <Check size={14} color={theme.colors.primaryFg} />
                            </View>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              <Field label="Poids (kg)">
                <TextInput
                  value={poids}
                  onChangeText={setPoids}
                  placeholder="0"
                  placeholderTextColor={theme.colors.subtle}
                  keyboardType="numeric"
                  style={styles.input}
                />
              </Field>

              <Field label="Méthode de pesée">
                <View style={styles.methodeRow}>
                  {PESEE_METHODES.map((m) => {
                    const active = methode === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setMethode(m)}
                        style={[styles.methodeBtn, active && styles.methodeBtnActive]}
                      >
                        <Text style={[styles.methodeBtnText, active && styles.methodeBtnTextActive]}>{m}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>

              <View style={styles.sheetActions}>
                <Button label="Annuler" variant="ghost" size="lg" onPress={() => setOpen(false)} style={{ flex: 1 }} />
                <Button
                  label={createMut.isPending ? "Enregistrement…" : "Valider la pesée"}
                  variant="primary"
                  size="lg"
                  onPress={handleSubmit}
                  disabled={!canSubmit}
                  style={{ flex: 1.4 }}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: theme.colors.foreground, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  grid3: { flexDirection: "row", gap: 8 },
  helperText: { fontSize: 11, color: theme.colors.warning, textAlign: "center", marginTop: -8, fontStyle: "italic" },

  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: theme.colors.card, borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border, padding: 14,
    ...theme.shadows.card,
  },
  rowLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  rowIcon: {
    width: 36, height: 36, borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryFaint,
    justifyContent: "center", alignItems: "center",
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  rowIdentifiant: { fontSize: 15, fontWeight: "700", color: theme.colors.primary, letterSpacing: 0.2, flex: 1 },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  rowDate: { fontSize: 11, color: theme.colors.muted },
  rowDot: { fontSize: 11, color: theme.colors.subtle },
  rowRace: { fontSize: 11, fontWeight: "500", color: theme.colors.muted },
  rowPoids: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  rowPoidsValue: { fontSize: 22, fontWeight: "700", color: theme.colors.primary, letterSpacing: -0.3 },
  rowPoidsUnit: { fontSize: 12, fontWeight: "600", color: theme.colors.muted },
  empty: { fontSize: 12, color: theme.colors.subtle, textAlign: "center", paddingVertical: 12 },

  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)" },
  sheet: {
    backgroundColor: theme.colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, borderWidth: 1, borderColor: theme.colors.border, maxHeight: "92%",
  },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: theme.colors.foreground },
  sheetSubtitle: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: theme.colors.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  input: {
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.md, paddingHorizontal: 12, height: 44, fontSize: 14,
    color: theme.colors.foreground, padding: 0,
  },
  pickerEmpty: {
    backgroundColor: theme.colors.hairline, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border,
    paddingVertical: 14, paddingHorizontal: 12, alignItems: "center",
  },
  pickerEmptyText: { fontSize: 12, color: theme.colors.muted, fontStyle: "italic" },
  pickerList: { gap: 6, maxHeight: 240 },
  pickerItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
    borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 10,
  },
  pickerItemActive: { backgroundColor: theme.colors.primaryFaint, borderColor: theme.colors.primary },
  pickerItemId: { fontSize: 13, fontWeight: "700", color: theme.colors.foreground },
  pickerItemIdActive: { color: theme.colors.primary },
  pickerItemMeta: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
  pickerItemCheck: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: theme.colors.primary,
    justifyContent: "center", alignItems: "center",
  },
  methodeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  methodeBtn: {
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.radius.md,
    backgroundColor: theme.colors.hairline, borderWidth: 1, borderColor: theme.colors.border,
  },
  methodeBtnActive: { backgroundColor: theme.colors.primaryFaint, borderColor: theme.colors.primary },
  methodeBtnText: { fontSize: 12, fontWeight: "500", color: theme.colors.muted },
  methodeBtnTextActive: { color: theme.colors.primary, fontWeight: "600" },
  sheetActions: { flexDirection: "row", gap: 8, marginTop: 8 },
});
