// Bottom tabs — 4 tabs clairs + design fleet management (sidebar sombre = pas applicable mobile, tabs blanches)
import * as React from "react";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, Beef, Landmark, FileText } from "lucide-react-native";
import { theme } from "@/constants/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" as const },
        tabBarIconStyle: { marginBottom: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Tableau", tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} /> }} />
      <Tabs.Screen name="bovins" options={{ title: "Bovins", tabBarIcon: ({ color }) => <Beef size={24} color={color} /> }} />
      <Tabs.Screen name="financement" options={{ title: "Finance", tabBarIcon: ({ color }) => <Landmark size={24} color={color} /> }} />
      <Tabs.Screen name="rapport" options={{ title: "Rapport", tabBarIcon: ({ color }) => <FileText size={24} color={color} /> }} />
      {/* Hidden routes */}
      <Tabs.Screen name="alimentation" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="depenses" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="ventes" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="plus" options={{ title: "Plus", tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} /> }} />
    </Tabs>
  );
}
