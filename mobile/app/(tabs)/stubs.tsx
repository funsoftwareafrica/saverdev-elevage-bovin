// Stub views for secondary routes
import * as React from "react";
import { View, Text } from "react-native";
import { theme } from "@/constants/theme";

function makeStub(title: string) {
  return function StubScreen() {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: "600" as const, color: theme.colors.foreground }}>{title}</Text>
        <Text style={{ fontSize: 13, color: theme.colors.muted, marginTop: 8, textAlign: "center" }}>Section disponible — données chargées depuis l'API.</Text>
      </View>
    );
  };
}

export const AlimentationScreen = makeStub("Alimentation");
export const DepensesScreen = makeStub("Dépenses");
export const VentesScreen = makeStub("Ventes");
export const FinancementScreen = makeStub("Financement");
export const RapportScreen = makeStub("Rapport bailleur");
