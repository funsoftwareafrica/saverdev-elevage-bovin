// Tests unitaires — lib/calculations.ts
// Vérifie le calcul du coût de revient et de la marge d'un bovin.

import { describe, it, expect } from "vitest";
import { computeBovinMarge } from "@/lib/calculations";
import type { Bovin } from "@/lib/types";

describe("computeBovinMarge", () => {
  it("calcule le coût de revient et la marge pour un bovin vendu", () => {
    // prixAchat 150 000 + coutsEngraissement 30 000 + autresCouts 10 000 = 190 000
    // marge = prixVente 250 000 - coutRevient 190 000 = 60 000
    const result = computeBovinMarge({
      prixAchat: 150000,
      coutsEngraissement: 30000,
      autresCouts: 10000,
      prixVente: 250000,
      statut: "VENDU",
    } as unknown as Bovin);

    expect(result.coutRevient).toBe(190000);
    expect(result.marge).toBe(60000);
  });

  it("retourne marge=null pour un bovin en engraissement", () => {
    // Statut ≠ "VENDU" → marge non calculée (null)
    const result = computeBovinMarge({
      prixVente: 0,
      statut: "EN_ENGRAISSEMENT",
    } as unknown as Bovin);

    expect(result.marge).toBeNull();
  });

  it("retourne une marge négative si le bovin est vendu à perte", () => {
    const result = computeBovinMarge({
      prixAchat: 200000,
      coutsEngraissement: 50000,
      autresCouts: 10000,
      prixVente: 150000,
      statut: "VENDU",
    } as unknown as Bovin);

    // coutRevient = 260 000 ; marge = 150 000 - 260 000 = -110 000
    expect(result.coutRevient).toBe(260000);
    expect(result.marge).toBe(-110000);
  });

  it("retourne marge=null pour un bovin mort (jamais vendu)", () => {
    const result = computeBovinMarge({
      prixAchat: 100000,
      coutsEngraissement: 20000,
      autresCouts: 5000,
      prixVente: 0,
      statut: "MORT",
    } as unknown as Bovin);

    expect(result.coutRevient).toBe(125000);
    expect(result.marge).toBeNull();
  });
});
