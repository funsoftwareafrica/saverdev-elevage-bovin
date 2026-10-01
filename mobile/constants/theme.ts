// Thème SAVERDEV — vert émeraude + blanc, style fleet management
export const theme = {
  colors: {
    background: "#F3F4F6",
    card: "#FFFFFF",
    surface: "#FFFFFF",
    foreground: "#111827",
    muted: "#6B7280",
    subtle: "#9CA3AF",
    border: "#E5E7EB",
    primary: "#10B981",
    primaryFaint: "#D1FAE5",
    primaryFg: "#FFFFFF",
    destructive: "#EF4444",
    warning: "#F59E0B",
    sidebar: "#111827",
    sidebarFg: "#E2E8F0",
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 },
  spacing: { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, "2xl": 32 },
  fontSize: { xs: 11, sm: 13, base: 15, lg: 18, xl: 22, "2xl": 28, "3xl": 34 },
  fontWeight: { regular: "400", medium: "500", semibold: "600", bold: "700" as const },
  shadows: {
    card: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
    lifted: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  },
} as const;
