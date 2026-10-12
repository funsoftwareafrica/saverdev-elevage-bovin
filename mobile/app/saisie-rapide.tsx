// Saisie rapide mobile — enregistrement minimaliste d'une opération sur le terrain.
// L'utilisateur choisit le type (achat, vente, dépense, pesée) puis remplit
// un formulaire très court. Tout passe par l'API web — la gestion du rôle
// (BENEFICIAIRE → workflow validation E2A) se fait côté serveur.
import * as React from "react";
import { ScrollView, View, Text, TextInput, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useBovins, useCreateSaisieRapide, useCreatePeseeRapide } from "@/lib/api";
import { theme } from "@/constants/theme";
import { SaverdevLogo } from "@/components/SaverdevLogo";
import { Button } from "@/components/Button";
import { ArrowLeft, Beef, ShoppingCart, Receipt, Scale, ChevronRight } from "lucide-react-native";

type SaisieType = "achat" | "vente" | "depense" | "pesee";

const TYPES: { key: SaisieType; label: string; desc: string; icon: typeof Beef }[] = [
  { key: "achat", label: "Achat", desc: "Nouvel animal acheté", icon: Beef },
  { key: "vente", label: "Vente", desc: "Animal vendu", icon: ShoppingCart },
  { key: "depense", label: "Dépense", desc: "Charge d'exploitation", icon: Receipt },
  { key: "pesee", label: "Pesée", desc: "Poids d'un animal", icon: Scale },
];

export default function SaisieRapideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: bovins } = useBovins();
  const saisie = useCreateSaisieRapide();
  const pesee = useCreatePeseeRapide();

  const [type, setType] = React.useState<SaisieType>("achat");
  const [montant, setMontant] = React.useState("");
  const [libelle, setLibelle] = React.useState("");
  const [poids, setPoids] = React.useState("");
  const [bovinId, setBovinId] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);

  const actifs = (bovins ?? []).filter((b) => b.statut === "EN_ENGRAISSEMENT");

  React.useEffect(() => {
    if (type === "vente" || type === "pesee") {
      // présélection du 1er bovin actif
      if (!bovinId && actifs.length > 0) setBovinId(actifs[0]!.id);
    }
  }, [type, bovins]);

  const onSubmit = () => {
    setSubmitting(true);
    if (type === "pesee") {
      const p = Number(poids);
      if (!bovinId || !p || p <= 0) {
        Alert.alert("Champs manquants", "Sélectionnez un animal et un poids.");
        setSubmitting(false);
        return;
      }
      pesee.mutate(
        { bovinId, poids: p, methode: "Manuelle" },
        {
          onSuccess: () => {
            Alert.alert("Pesée enregistrée", `${p} kg pour ${bovins?.find((b) => b.id === bovinId)?.identifiant ?? "l'animal"}`);
            setPoids(""); setSubmitting(false);
          },
          onError: () => { Alert.alert("Erreur", "Échec de l'enregistrement"); setSubmitting(false); },
        }
      );
      return;
    }
    const m = Number(montant);
    if ((type === "achat" || type === "depense") && (!m || m <= 0)) {
      Alert.alert("Montant invalide", "Saisissez un montant positif.");
      setSubmitting(false);
      return;
    }
    const payload: Record<string, unknown> = { type, date: new Date().toISOString().slice(0, 10) };
    if (type === "achat") {
      Object.assign(payload, {
        espece: "BOVIN", race: "Zébu", sexe: "Mâle", nbSujets: 1,
        prixUnitaire: m, poids: Number(poids) || 0, gestionnaire: "SAVERDEV",
      });
    } else if (type === "vente") {
      Object.assign(payload, {
        bovinId, espece: bovins?.find((b) => b.id === bovinId)?.identifiant?.startsWith("OVN") ? "OVIN" : "BOVIN",
        nbSujets: 1, prixUnitaire: m, acheteur: libelle || "Client",
      });
    } else if (type === "depense") {
      Object.assign(payload, {
        categorie: "Autres", libelle: libelle || "Dépense mobile", montant: m,
      });
    }
    saisie.mutate(payload as Parameters<typeof saisie.mutate>[0], {
      onSuccess: (res: { pending?: boolean; identifiant?: string; validationId?: string }) => {
        if (res?.pending) {
          Alert.alert("Saisie soumise", "En attente de validation E2A. Vous serez notifié.");
        } else {
          Alert.alert("Saisie enregistrée", res?.identifiant ? `Animal ${res.identifiant} créé` : "Opération appliquée");
        }
        setMontant(""); setLibelle(""); setPoids(""); setSubmitting(false);
      },
      onError: () => { Alert.alert("Erreur", "Échec de l'enregistrement"); setSubmitting(false); },
    });
  };

  const busy = saisie.isPending || pesee.isPending || submitting;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, paddingBottom: 40, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
        <ArrowLeft size={16} color={theme.colors.muted} />
        <Text style={styles.backLabel}>Retour</Text>
      </Pressable>

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Saisie rapide</Text>
          <Text style={styles.subtitle}>Enregistrez une opération sur le terrain en quelques secondes</Text>
        </View>
        <SaverdevLogo size={40} />
      </View>

      {/* Sélecteur de type */}
      <View style={styles.typeGrid}>
        {TYPES.map((t) => {
          const active = type === t.key;
          const Icon = t.icon;
          return (
            <Pressable
              key={t.key}
              onPress={() => setType(t.key)}
              style={({ pressed }) => [
                styles.typeCard,
                active && styles.typeCardActive,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <View style={[styles.typeIcon, active && styles.typeIconActive]}>
                <Icon size={20} color={active ? theme.colors.primaryFg : theme.colors.primary} />
              </View>
              <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{t.label}</Text>
              <Text style={styles.typeDesc}>{t.desc}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Formulaire dynamique selon le type */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Détails de la saisie</Text>

        {(type === "vente" || type === "pesee") && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Animal concerné</Text>
            <View style={styles.picker}>
              {actifs.length === 0 ? (
                <Text style={styles.pickerEmpty}>Aucun animal disponible</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                  {actifs.slice(0, 20).map((b) => {
                    const sel = b.id === bovinId;
                    return (
                      <Pressable key={b.id} onPress={() => setBovinId(b.id)} style={[styles.pickerItem, sel && styles.pickerItemActive]}>
                        <Text style={[styles.pickerItemText, sel && styles.pickerItemTextActive]}>{b.identifiant}</Text>
                        <Text style={styles.pickerItemSub}>{b.race}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        )}

        {(type === "achat" || type === "depense") && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Montant (FCFA)</Text>
            <TextInput
              style={styles.input}
              placeholder="35000"
              keyboardType="numeric"
              value={montant}
              onChangeText={setMontant}
            />
          </View>
        )}

        {type === "vente" && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Acheteur (libellé)</Text>
            <TextInput
              style={styles.input}
              placeholder="Client"
              value={libelle}
              onChangeText={setLibelle}
            />
          </View>
        )}

        {type === "depense" && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Libellé</Text>
            <TextInput
              style={styles.input}
              placeholder="Vaccination, transport…"
              value={libelle}
              onChangeText={setLibelle}
            />
          </View>
        )}

        {(type === "achat" || type === "pesee") && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{type === "pesee" ? "Poids (kg)" : "Poids d'achat (kg)"}</Text>
            <TextInput
              style={styles.input}
              placeholder="250"
              keyboardType="numeric"
              value={poids}
              onChangeText={setPoids}
            />
          </View>
        )}

        <Button
          label={busy ? "Enregistrement…" : "Enregistrer"}
          variant="primary"
          size="lg"
          disabled={busy}
          icon={busy ? <ActivityIndicator color={theme.colors.primaryFg} size="small" /> : undefined}
          onPress={onSubmit}
        />
      </View>

      <View style={styles.noteBox}>
        <ChevronRight size={14} color={theme.colors.muted} />
        <Text style={styles.noteText}>
          Les saisies du Bénéficiaire sont mises en attente et appliquées après validation E2A.
          Les autres rôles appliquent directement.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", paddingVertical: 4, paddingRight: 8 },
  backLabel: { fontSize: 13, color: theme.colors.muted, fontWeight: "500" },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 22, fontWeight: "700" as const, color: theme.colors.foreground, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },

  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeCard: {
    flex: 1, minWidth: 140, padding: 12, borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border,
    alignItems: "center", gap: 6, ...theme.shadows.card,
  },
  typeCardActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryFaint },
  typeIcon: {
    width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center",
    backgroundColor: theme.colors.primaryFaint,
  },
  typeIconActive: { backgroundColor: theme.colors.primary },
  typeLabel: { fontSize: 14, fontWeight: "700" as const, color: theme.colors.foreground },
  typeLabelActive: { color: theme.colors.primary },
  typeDesc: { fontSize: 11, color: theme.colors.muted, textAlign: "center" },

  formCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: 16, gap: 12, ...theme.shadows.card },
  formTitle: { fontSize: 14, fontWeight: "700" as const, color: theme.colors.foreground },
  field: { gap: 6 },
  fieldLabel: { fontSize: 11, color: theme.colors.muted, fontWeight: "600" as const, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingVertical: 10, paddingHorizontal: 12, fontSize: 15, color: theme.colors.foreground, backgroundColor: theme.colors.background },

  picker: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingVertical: 8 },
  pickerScroll: { paddingHorizontal: 8 },
  pickerEmpty: { fontSize: 12, color: theme.colors.muted, paddingVertical: 8, textAlign: "center" },
  pickerItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.background, marginRight: 6, borderWidth: 1, borderColor: theme.colors.border },
  pickerItemActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pickerItemText: { fontSize: 13, fontWeight: "700" as const, color: theme.colors.primary },
  pickerItemTextActive: { color: theme.colors.primaryFg },
  pickerItemSub: { fontSize: 10, color: theme.colors.muted, marginTop: 2 },

  noteBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: theme.colors.primaryFaint, borderRadius: theme.radius.sm, padding: 10, borderWidth: 1, borderColor: "#A7F3D0" },
  noteText: { flex: 1, fontSize: 11, color: theme.colors.muted, lineHeight: 16 },
});
