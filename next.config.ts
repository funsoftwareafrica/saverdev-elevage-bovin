import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;

// Désactiver le telemetry Next.js
process.env.NEXT_TELEMETRY_DISABLED = "1";
