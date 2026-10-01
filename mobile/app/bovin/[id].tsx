// Fiche bovin — vue détail mobile
import * as React from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useBovins } from "@/lib/api";
import { computeBovinMarge } from "@/lib/calculs";
import { formatFCFA, formatDate, statutBovinColor, joursEntre } from "@/lib/format";
import { theme } from "@/constants/theme";
import { ArrowLeft, Beef, ShoppingCart, Wallet, TrendingUp, Calendar, Scale, User } from "lucide-react-native";

export default function FicheBovinScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bovins } = useBovins();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bovin = (bovins ?? []).find((b) => b.id === id);

  if (!bovin) return <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ paddingTop: 60 + insets.top, padding: 16 }}><Text style={{ color: theme.colors.muted, textAlign: "center" }}>Bovin introuvable.</Text></ScrollView>;

  const { coutRevient, marge } = computeBovinMarge(bovin);
  const sc = statutBovinColor(bovin.statut);
  const duree = joursEntre(bovin.dateAchat, bovin.dateVente);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 16, paddingTop: 16 + insets.top, paddingBottom: 40, gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.card, justifyContent: "center", alignItems: "center", ...theme.shadows.card }}>
          <ArrowLeft size={22} color={theme.colors.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: "700" as const, color: theme.colors.primary, fontFamily: "monospace" }}>{bovin.identifiant}</Text>
          <Text style={{ fontSize: 13, color: theme.colors.muted }}>{bovin.race} · {bovin.sexe}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: sc.bg }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sc.fg }} />
          <Text style={{ fontSize: 12, fontWeight: "600" as const, color: sc.fg }}>{bovin.statut === "EN_ENGRAISSEMENT" ? "Actif" : bovin.statut === "VENDU" ? "Vendu" : "Mort"}</Text>
        </View>
      </View>

      {marge !== null && (
        <View style={{ backgroundColor: marge >= 0 ? "#D1FAE5" : "#FEE2E2", borderRadius: 14, padding: 20, ...theme.shadows.card }}>
          <Text style={{ fontSize: 12, color: theme.colors.muted }}>Marge réalisée</Text>
          <Text style={{ fontSize: 32, fontWeight: "700" as const, color: marge >= 0 ? "#065F46" : "#991B1B", marginTop: 4 }}>{formatFCFA(marge)}</Text>
          <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 4 }}>{((marge / coutRevient) * 100).toFixed(1)}% du coût de revient</Text>
        </View>
      )}

      <View style={{ backgroundColor: theme.colors.card, borderRadius: 14, padding: 16, ...theme.shadows.card }}>
        <Text style={{ fontSize: 15, fontWeight: "600" as const, color: theme.colors.foreground, marginBottom: 12 }}>Identification</Text>
        {[
          { icon: Beef, label: "Race", value: bovin.race },
          { icon: User, label: "Sexe", value: bovin.sexe },
          { icon: Scale, label: "Poids à l'achat", value: `${bovin.poidsAchat} kg` },
          { icon: Calendar, label: "Date d'achat", value: formatDate(bovin.dateAchat) },
          { icon: Beef, label: "Durée en cycle", value: `${duree} jours` },
          ...(bovin.dateVente ? [{ icon: Calendar, label: "Date de vente", value: formatDate(bovin.dateVente) }] : []),
          ...(bovin.clientVente ? [{ icon: User, label: "Client", value: bovin.clientVente }] : []),
        ].map((row, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
            <row.icon size={18} color={theme.colors.muted} />
            <Text style={{ flex: 1, fontSize: 14, color: theme.colors.muted }}>{row.label}</Text>
            <Text style={{ fontSize: 14, fontWeight: "500" as const, color: theme.colors.foreground }}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={{ backgroundColor: theme.colors.card, borderRadius: 14, padding: 16, ...theme.shadows.card }}>
        <Text style={{ fontSize: 15, fontWeight: "600" as const, color: theme.colors.foreground, marginBottom: 12 }}>Coûts & marge</Text>
        {[
          { icon: ShoppingCart, label: "Prix d'achat", value: bovin.prixAchat },
          { icon: Wallet, label: "Coûts engraissement", value: bovin.coutsEngraissement },
          { icon: Wallet, label: "Autres coûts", value: bovin.autresCouts },
        ].map((row, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
            <row.icon size={18} color={theme.colors.muted} />
            <Text style={{ flex: 1, fontSize: 14, color: theme.colors.muted }}>{row.label}</Text>
            <Text style={{ fontSize: 14, fontWeight: "500" as const, color: theme.colors.foreground }}>{formatFCFA(row.value, false)} FCFA</Text>
          </View>
        ))}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
          <Text style={{ fontSize: 15, fontWeight: "600" as const, color: theme.colors.foreground }}>Coût de revient</Text>
          <Text style={{ fontSize: 17, fontWeight: "700" as const, color: theme.colors.primary }}>{formatFCFA(coutRevient)}</Text>
        </View>
        {bovin.statut === "VENDU" && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <Text style={{ fontSize: 15, fontWeight: "600" as const, color: theme.colors.foreground }}>Marge</Text>
            <Text style={{ fontSize: 17, fontWeight: "700" as const, color: marge! >= 0 ? "#10B981" : "#EF4444" }}>{formatFCFA(marge)}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
