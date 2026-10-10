// Scanner QR (simulé) — viseur caméra + bouton "Simuler un scan" qui
// choisit un bovin au hasard dans useBovins() et navigue vers /bovin/[id].
// Aucune dépendance expo-camera : viseur purement visuel (View + bordures).
import * as React from "react";
import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useBovins } from "@/lib/api";
import { theme } from "@/constants/theme";
import { SaverdevLogo } from "@/components/SaverdevLogo";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/Button";
import { ScanLine, ArrowLeft, QrCode, Camera, ChevronRight } from "lucide-react-native";
import type { Bovin } from "@/lib/types";

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: bovins, isLoading, isFetching } = useBovins();

  // Petit effet de "scan" : pendant X ms on affiche un spinner, puis on redirige.
  const [scanning, setScanning] = React.useState(false);

  const simulateScan = React.useCallback(() => {
    if (!bovins || bovins.length === 0) {
      Alert.alert("Aucun bovin", "Aucun bovin disponible pour la simulation. Réessayez plus tard.");
      return;
    }
    setScanning(true);
    // Simule la durée de lecture d'un QR (600 ms)
    const pick: Bovin = bovins[Math.floor(Math.random() * bovins.length)]!;
    setTimeout(() => {
      setScanning(false);
      router.push({ pathname: "/bovin/[id]", params: { id: pick.id } });
    }, 600);
  }, [bovins, router]);

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
      {/* Bouton retour inline */}
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
        <ArrowLeft size={16} color={theme.colors.muted} />
        <Text style={styles.backLabel}>Retour</Text>
      </Pressable>

      {/* En-tête */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Scanner un bovin</Text>
          <Text style={styles.subtitle}>Scannez le QR code d'un bovin pour ouvrir sa fiche</Text>
        </View>
        <SaverdevLogo size={40} />
      </View>

      {/* Viseur caméra (placeholder) */}
      <View style={styles.viewfinderWrap}>
        <View style={styles.viewfinder}>
          {/* Coins en émeraude (4 accents) */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          {/* Ligne de scan animée (simulée) */}
          <View style={styles.scanLine} />
          {/* Réticule central */}
          <View style={styles.reticle}>
            <View style={styles.reticleH} />
            <View style={styles.reticleV} />
          </View>
          {/* Indicateur central */}
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

      {/* Bouton simulation */}
      <Button
        label={scanning ? "Lecture en cours…" : "Simuler un scan"}
        variant="primary"
        size="lg"
        icon={<ScanLine size={18} color={theme.colors.primaryFg} />}
        onPress={simulateScan}
        disabled={scanning || bovins.length === 0 || isFetching}
      />

      {/* Note technique */}
      <View style={styles.noteBox}>
        <Camera size={14} color={theme.colors.muted} />
        <Text style={styles.noteText}>
          La capture caméra réelle nécessite expo-camera (à configurer en production).
          Cette vue simule la lecture et redirige vers une fiche bovin existante.
        </Text>
      </View>

      {/* Aperçu bovins scannables */}
      <View style={styles.previewSection}>
        <Text style={styles.previewTitle}>{bovins.length} bovin(s) scannable(s)</Text>
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
  title: { fontSize: 22, fontWeight: "700", color: theme.colors.foreground, letterSpacing: -0.3 },
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
    // léger shadow pour le côté "caméra"
    ...theme.shadows.cardLifted,
  },
  // Coins : 4 accents L-shaped (60x60, bordure 4px primary)
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

  // Ligne de scan (horizontale, translucide)
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
    fontSize: 12, fontWeight: "600", color: theme.colors.muted,
    textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4,
  },

  noteBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: theme.colors.primaryFaint, borderRadius: theme.radius.md,
    padding: 12, borderWidth: 1, borderColor: "#A7F3D0",
  },
  noteText: { flex: 1, fontSize: 11, color: theme.colors.muted, lineHeight: 16 },

  previewSection: { gap: 8, marginTop: 4 },
  previewTitle: {
    fontSize: 11, fontWeight: "600", color: theme.colors.muted,
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
  previewId: { fontSize: 14, fontWeight: "700", color: theme.colors.primary, letterSpacing: 0.2 },
  previewMeta: { fontSize: 11, color: theme.colors.muted, marginTop: 2 },
});
