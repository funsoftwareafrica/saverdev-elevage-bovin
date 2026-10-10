// QueryProvider — TanStack Query pour React Native
import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { theme } from "@/constants/theme";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// ErrorBoundary simple pour les erreurs de fetch
export function ApiError({ message }: { message: string }) {
  return (
    <View style={{ padding: 16, backgroundColor: theme.colors.dangerFaint, borderRadius: 12, borderWidth: 1, borderColor: "#FECACA" }}>
      <Text style={{ color: theme.colors.danger, fontSize: 13, fontWeight: "600" }}>Erreur de chargement</Text>
      <Text style={{ color: theme.colors.danger, fontSize: 11, marginTop: 4 }}>{message}</Text>
    </View>
  );
}
