"use client";

// SessionProvider — wrap l'app pour exposer useSession côté client.
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function SessionProviderWrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
