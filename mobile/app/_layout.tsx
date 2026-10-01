// Root layout — SafeArea + QueryProvider + StatusBar
import * as React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { theme } from "@/constants/theme";

export default function RootLayout() {
  const [client] = React.useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } }));
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <StatusBar style="dark" backgroundColor={theme.colors.background} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="bovin/[id]" options={{ presentation: "card", headerShown: true, headerTitle: "Fiche bovin", headerTintColor: theme.colors.primary }} />
          <Stack.Screen name="profile" options={{ presentation: "modal", headerShown: true, headerTitle: "Profil", headerTintColor: theme.colors.primary }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
