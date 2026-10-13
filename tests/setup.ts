import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Force UTC timezone so date formatting is consistent across environments.
// (Node.js honours TZ changes at runtime when full-ICU is available.)
process.env.TZ = "UTC";

afterEach(() => {
  cleanup();
});

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock next/server — avoids pulling Next.js runtime into unit tests
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    })),
  },
}));

// Mock @/lib/db (Prisma client) so test files that transitively import Prisma
// (e.g. saisie-ops.ts) don't try to connect to a real database.
vi.mock("@/lib/db", () => ({
  db: {
    bovin: {
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    depense: { create: vi.fn() },
    stockMouvement: { create: vi.fn() },
    capitalMouvement: { create: vi.fn() },
    historique: { create: vi.fn() },
  },
}));
