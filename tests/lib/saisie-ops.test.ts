// Tests unitaires — lib/saisie-ops.ts
// Vérifie la sérialisation/désérialisation des opérations de saisie.
// Les autres fonctions du module (applySaisieOperation) touchent à la DB
// et ne sont pas testées ici — la DB est mockée dans tests/setup.ts.

import { describe, it, expect } from "vitest";
import {
  serializeSaisie,
  deserializeSaisie,
} from "@/lib/saisie-ops";
import type { SaisiePayload } from "@/lib/saisie-ops";

describe("serializeSaisie", () => {
  it("produit une chaîne JSON valide pour une dépense", () => {
    const payload: SaisiePayload = {
      type: "depense",
      data: { montant: 50000 },
    };
    const serialized = serializeSaisie(payload);

    // La chaîne doit être du JSON valide (peut être re-parsée sans erreur)
    expect(() => JSON.parse(serialized)).not.toThrow();
  });

  it("préserve le type et les données après sérialisation", () => {
    const payload: SaisiePayload = {
      type: "depense",
      data: { montant: 50000 },
    };
    const serialized = serializeSaisie(payload);
    const parsed = JSON.parse(serialized) as SaisiePayload;

    expect(parsed.type).toBe("depense");
    expect(parsed.data).toEqual({ montant: 50000 });
  });

  it("gère un payload avec données complexes", () => {
    const payload: SaisiePayload = {
      type: "achat",
      data: {
        espece: "BOVIN",
        race: "Zébu",
        prixUnitaire: 150000,
        nbSujets: 3,
        date: "2025-10-12",
      },
    };
    const serialized = serializeSaisie(payload);
    const parsed = JSON.parse(serialized) as SaisiePayload;

    expect(parsed.type).toBe("achat");
    expect(parsed.data).toEqual({
      espece: "BOVIN",
      race: "Zébu",
      prixUnitaire: 150000,
      nbSujets: 3,
      date: "2025-10-12",
    });
  });
});

describe("deserializeSaisie", () => {
  it("désérialise une chaîne JSON valide", () => {
    const json = '{"type":"depense","data":{"montant":50000}}';
    const result = deserializeSaisie(json);

    expect(result).not.toBeNull();
    expect(result?.type).toBe("depense");
    expect(result?.data).toEqual({ montant: 50000 });
  });

  it("retourne null pour une chaîne JSON invalide", () => {
    expect(deserializeSaisie("not-json")).toBeNull();
  });

  it("retourne null si le type est manquant", () => {
    const json = '{"data":{"montant":50000}}';
    expect(deserializeSaisie(json)).toBeNull();
  });

  it("retourne null si data est manquant", () => {
    const json = '{"type":"depense"}';
    expect(deserializeSaisie(json)).toBeNull();
  });

  it("retourne null pour une chaîne vide", () => {
    expect(deserializeSaisie("")).toBeNull();
  });

  it("round-trip : serialize → deserialize préserve le payload", () => {
    const original: SaisiePayload = {
      type: "vente",
      data: { bovinId: "abc123", prixUnitaire: 250000 },
    };
    const roundTripped = deserializeSaisie(serializeSaisie(original));

    expect(roundTripped).not.toBeNull();
    expect(roundTripped?.type).toBe(original.type);
    expect(roundTripped?.data).toEqual(original.data);
  });
});
