// Scanner QR — viseur caméra + saisie manuelle d'un identifiant BOE-xxx ou OVN-xxx.
//
// Sans expo-camera (non installé), la lecture caméra réelle n'est pas
// disponible — l'utilisateur peut soit :
//   - saisir manuellement l'identifiant lu sur un collier / étiquette
//   - "simuler" un scan qui choisit un bovin au hasard
//
// En production, il faudrait installer expo-camera et brancher un reader
// de QR code (e.g. barcodescanner).
import * as React from "react";
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useBovins } from "@/lib/api";
import { theme } from "@/constants/theme";
import { SaverdevLogo } from "@/components/SaverdevLogo";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { ScanLine, ArrowLeft, QrCode, Camera, ChevronRight, Search } from "lucide-react-native";
import type { Bovin } from "@/lib/types";

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: bovins, isLoading, isFetching } = useBovins();

  const [scanning, setScanning] = React.useState(false);
  const [manualId, setManualId] = React.useState("");

  const simulateScan = React.useCallback(() => {
    if (!bovins || bovins.length === 0) {
      Alert.alert("Aucun bovin", "Aucun bovin disponible pour la simulation. Réessayez plus tard.");
      return;
    }
    setScanning(true);
    const pick: Bovin = bovins[Math.floor(Math.random() * bovins.length)]!;
    setTimeout(() => {
      setScanning(false);
      router.push({ pathname: "/bovin/[id]", params: { id: pick.id } });
    }, 600);
  }, [bovins, router]);

  const onManualSubmit = React.useCallback(() => {
    const q = manualId.trim().toUpperCase();
    if (!q || !bovins) return;
    // Recherche par identifiant exact (BOE-001 ou OVN-001)
    let match = bovins.find((b) => b.identifiant.toUpperCase() === q);
    // Sinon : recherche par identifiant partiel (préfixe + numéro)
    if (!match) {
      const m = /^(BOE|OVN)[-_\s]?(\d{1,4})$/i.exec(q);
      if (m) {
        const num = parseInt(m[2]!, 10);
        const prefix = m[1]!.toUpperCase();
        const formatted = `${prefix}-${String(num).padStart(3, "0")}`;
        match = bovins.find((b) => b.identifiant.toUpperCase() === formatted) ??
          bovins.find((b) => b.identifiant.toUpperCase().includes(`${prefix}-${num}`));
      }
    }
    if (!match) {
      Alert.alert("Introuvable", `Aucun animal ne correspond à « ${manualId} ».`);
      return;
    }
    setManualId("");
    router.push({ pathname: "/bovin/[id]", params: { id: match.id } });
  }, [manualId, bovins, router]);

  if (isLoading || !bovins) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, gap: 16 }}
      >
        <Skeleton style={{ height: 40 }} />
        <Skeleton style={{ height: 320, borderRadius: 24 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, paddingBottom: 40, gap: 18 }}
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
        <ArrowLeft size={16} color={theme.colors.muted} />
        <Text style={styles.backLabel}>Retour</Text>
      </Pressable>

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Scanner un animal</Text>
          <Text style={styles.subtitle}>Scannez le QR code d'un bovin (BOE-xxx) ou d'un ovin (OVN-xxx) pour ouvrir sa fiche</Text>
        </View>
        <SaverdevLogo size={40} />
      </View>

      <View style={styles.viewfinderWrap}>
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <View style={styles.scanLine} />
          <View style={styles.reticle}>
            <View style={styles.reticleH} />
            <View style={styles.reticleV} />
          </View>
          {scanning ? (
            <View style={styles.centerOverlay}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
              <Text style={styles.scanLabel}>Lecture du code…</Text>
            </View>
          ) : (
            <View style={styles.centerOverlay}>
              <QrCode size={56} color={theme.colors.primary} />
              <Text style={styles.scanLabel}>Visez le QR code</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.manualBox}>
        <Text style={styles.manualLabel}>Saisie manuelle</Text>
        <Text style={styles.manualHelp}>Entrez un identifiant BOE-xxx ou OVN-xxx</Text>
        <View style={styles.manualRow}>
          <View style={styles.manualInputWrap}>
            <Search size={16} color={theme.colors.muted} />
            <TextInput
              style={styles.manualInput}
              placeholder="BOE-001"
              autoCapitalize="characters"
              autoCorrect={false}
              value={manualId}
              onChangeText={setManualId}
              onSubmitEditing={onManualSubmit}
              returnKeyType="search"
            />
          </View>
          <Button
            label="Ouvrir"
            variant="primary"
            size="md"
            disabled={!manualId.trim()}
            onPress={onManualSubmit}
          />
        </View>
      </View>

      <Button
        label={scanning ? "Lecture en cours…" : "Simuler un scan"}
        variant="outline"
        size="lg"
        icon={<ScanLine size={18} color={theme.colors.primary} />}
        onPress={simulateScan}
        disabled={scanning || bovins.length === 0 || isFetching}
      />

      <View style={styles.noteBox}>
        <Camera size={14} color={theme.colors.muted} />
        <Text style={styles.noteText}>
          La capture caméra réelle nécessite expo-camera (à configurer en production).
          Cette vue simule la lecture et redirige vers une fiche bovin existante,
          ou utilise la saisie manuelle de l'identifiant.
        </Text>
      </View>

      <View style={styles.previewSection}>
        <Text style={styles.previewTitle}>{bovins.length} animal(aux) scannable(s)</Text>
        <View style={styles.previewList}>
          {bovins.slice(0, 5).map((b) => (
            <Pressable
              key={b.id}
              style={({ pressed }) => [styles.previewRow, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => router.push({ pathname: "/bovin/[id]", params: { id: b.id } })}
            >
              <View style={styles.previewIcon}>
                <QrCode size={16} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewId}>{b.identifiant}</Text>
                <Text style={styles.previewMeta}>{b.race} · {b.poidsAchat} kg</Text>
              </View>
              <ChevronRight size={16} color={theme.colors.subtle} />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    paddingVertical: 4, paddingRight: 8,
  },
  backLabel: { fontSize: 13, color: theme.colors.muted, fontWeight: "500" },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 22, fontWeight: "700" as const, color: theme.colors.foreground, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },

  viewfinderWrap: {
    alignItems: "center",
    paddingVertical: 8,
  },
  viewfinder: {
    width: 280,
    height: 280,
    backgroundColor: theme.colors.hairline,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.cardLifted,
  },
  corner: {
    position: "absolute",
    width: 56,
    height: 56,
    borderColor: theme.colors.primary,
  },
  cornerTL: { top: 16, left: 16, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: 16, right: 16, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: 16, left: 16, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 16, right: 16, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },

  scanLine: {
    position: "absolute",
    left: 24,
    right: 24,
    top: "50%",
    height: 2,
    backgroundColor: theme.colors.primary,
    opacity: 0.6,
    borderRadius: 1,
  },
  reticle: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  reticleH: { position: "absolute", width: 80, height: 1, backgroundColor: theme.colors.subtle, opacity: 0.5 },
  reticleV: { position: "absolute", width: 1, height: 80, backgroundColor: theme.colors.subtle, opacity: 0.5 },

  centerOverlay: { alignItems: "center", gap: 10, padding: 16 },
  scanLabel: {
    fontSize: 12, fontWeight: "600" as const, color: theme.colors.muted,
    textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4,
  },

  manualBox: { backgroundColor: theme.colors.card, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: 14, gap: 8, ...theme.shadows.card },
  manualLabel: { fontSize: 13, fontWeight: "700" as const, color: theme.colors.foreground },
  manualHelp: { fontSize: 11, color: theme.colors.muted },
  manualRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  manualInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: theme.colors.background },
  manualInput: { flex: 1, fontSize: 14, color: theme.colors.foreground },

  noteBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: theme.colors.primaryFaint, borderRadius: theme.radius.md,
    padding: 12, borderWidth: 1, borderColor: "#A7F3D0",
  },
  noteText: { flex: 1, fontSize: 11, color: theme.colors.muted, lineHeight: 16 },

  previewSection: { gap: 8, marginTop: 4 },
  previewTitle: {
    fontSize: 11, fontWeight: "600" as const, color: theme.colors.muted,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  previewList: { gap: 6 },
  previewRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: theme.colors.card, borderRadius: theme.radius.md,
    borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 12,
    ...theme.shadows.card,
  },
  previewIcon: {
    width: 36, height: 36, borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryFaint,
    justifyContent: "center", alignItems: "center",
  },
  previewId: { fontSize: 14, fontWeight: "700" as const, color: theme.colors.primary, letterSpacing: 0.2 },
  previewMeta: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
});
