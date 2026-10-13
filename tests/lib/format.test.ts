// Tests unitaires — lib/format.ts
// Vérifie le formatage des montants FCFA, des dates, des couleurs de badges,
// la génération d'identifiants animaux et le formatage de tailles de fichiers.

import { describe, it, expect } from "vitest";
import {
  formatFCFA,
  formatFCFAShort,
  formatDate,
  formatDateTime,
  nowDateTimeLocal,
  joursEntre,
  statutBovinColor,
  statutEcheanceColor,
  severiteColor,
  nextAnimalIdentifiant,
  formatBytes,
} from "@/lib/format";

// Utilitaire : normalise les espaces insécables (NBSP \u00A0, NNBSP \u202F)
// en espaces simples afin de pouvoir comparer des chaînes contenant des
// séparateurs de milliers produits par Intl.NumberFormat("fr-FR").
function normalizeSpaces(s: string): string {
  return s.replace(/[\u00A0\u202F\s]/g, " ");
}

describe("formatFCFA", () => {
  it("formate un montant avec séparateurs de milliers + symbole FCFA", () => {
    const result = normalizeSpaces(formatFCFA(150000));
    expect(result).toBe("150 000 FCFA");
  });

  it("retourne la valeur brute sans symbole quand withSymbol=false", () => {
    const result = normalizeSpaces(formatFCFA(150000, false));
    expect(result).toBe("150 000");
  });

  it("gère les valeurs null/undefined en renvoyant 0 FCFA", () => {
    expect(normalizeSpaces(formatFCFA(null))).toBe("0 FCFA");
    expect(normalizeSpaces(formatFCFA(undefined))).toBe("0 FCFA");
    expect(normalizeSpaces(formatFCFA(NaN))).toBe("0 FCFA");
  });

  it("formate un grand montant", () => {
    const result = normalizeSpaces(formatFCFA(5000000));
    expect(result).toBe("5 000 000 FCFA");
  });
});

describe("formatFCFAShort", () => {
  it("formate un montant en millions (1,5 M FCFA)", () => {
    // Le séparateur décimal peut être . ou , selon l'environnement — on accepte les deux.
    expect(formatFCFAShort(1500000)).toMatch(/^1[.,]5\s+M\s+FCFA$/);
  });

  it("formate un montant en milliers (50 k FCFA)", () => {
    expect(formatFCFAShort(50000)).toBe("50 k FCFA");
  });

  it("formate un montant entier en millions sans décimale", () => {
    expect(formatFCFAShort(2000000)).toBe("2 M FCFA");
  });

  it("formate un petit montant sans abréviation", () => {
    expect(formatFCFAShort(500)).toBe("500 FCFA");
  });

  it("gère null/undefined/NaN en renvoyant 0 FCFA", () => {
    expect(formatFCFAShort(null)).toBe("0 FCFA");
    expect(formatFCFAShort(undefined)).toBe("0 FCFA");
    expect(formatFCFAShort(NaN)).toBe("0 FCFA");
  });
});

describe("formatDate", () => {
  it("formate une date ISO en JJ/MM/AAAA", () => {
    // TZ=UTC forcé dans setup.ts : new Date("2025-10-12") = 2025-10-12T00:00:00.000Z
    expect(formatDate("2025-10-12")).toBe("12/10/2025");
  });

  it("retourne '—' pour null/undefined", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });

  it("retourne '—' pour une date invalide", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("formate une date ISO en JJ/MM/AAAA HH:MM", () => {
    const result = formatDateTime("2025-10-12T15:30");
    expect(result).toContain("12/10/2025");
    expect(result).toContain("15:30");
    expect(result).toMatch(/^12\/10\/2025 15:30$/);
  });

  it("retourne '—' pour null/undefined", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
  });

  it("retourne '—' pour une date invalide", () => {
    expect(formatDateTime("invalid")).toBe("—");
  });
});

describe("nowDateTimeLocal", () => {
  it("retourne une chaîne au format YYYY-MM-DDTHH:MM", () => {
    expect(nowDateTimeLocal()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe("joursEntre", () => {
  it("calcule le nombre de jours entre 2 dates", () => {
    expect(joursEntre("2025-01-01", "2025-01-31")).toBe(30);
  });

  it("retourne 0 si la date de fin est avant la date de début", () => {
    expect(joursEntre("2025-01-31", "2025-01-01")).toBe(0);
  });

  it("utilise maintenant comme date de fin par défaut", () => {
    // On ne peut pas prédir la valeur exacte, on vérifie juste que c'est >= 0
    expect(joursEntre("2025-01-01")).toBeGreaterThanOrEqual(0);
  });
});

describe("statutBovinColor", () => {
  it("retourne des classes contenant 'primary' pour EN_ENGRAISSEMENT", () => {
    expect(statutBovinColor("EN_ENGRAISSEMENT")).toContain("primary");
  });

  it("retourne des classes contenant 'emerald' pour VENDU", () => {
    expect(statutBovinColor("VENDU")).toContain("emerald");
  });

  it("retourne des classes contenant 'red' pour MORT", () => {
    expect(statutBovinColor("MORT")).toContain("red");
  });

  it("retourne les classes muted par défaut", () => {
    expect(statutBovinColor("INCONNU")).toContain("muted");
  });
});

describe("statutEcheanceColor", () => {
  it("retourne des classes contenant 'emerald' pour PAYEE", () => {
    expect(statutEcheanceColor("PAYEE")).toContain("emerald");
  });

  it("retourne des classes contenant 'amber' pour A_PAYER", () => {
    expect(statutEcheanceColor("A_PAYER")).toContain("amber");
  });

  it("retourne des classes contenant 'red' pour EN_RETARD", () => {
    expect(statutEcheanceColor("EN_RETARD")).toContain("red");
  });
});

describe("severiteColor", () => {
  it("retourne des classes contenant 'sky' pour INFO", () => {
    expect(severiteColor("INFO")).toContain("sky");
  });

  it("retourne des classes contenant 'amber' pour WARNING", () => {
    expect(severiteColor("WARNING")).toContain("amber");
  });

  it("retourne des classes contenant 'red' pour CRITICAL", () => {
    expect(severiteColor("CRITICAL")).toContain("red");
  });
});

describe("nextAnimalIdentifiant", () => {
  it("génère BOE-002 à partir d'un bovin BOE-001", () => {
    expect(nextAnimalIdentifiant("BOVIN", [{ identifiant: "BOE-001" }])).toBe(
      "BOE-002"
    );
  });

  it("génère OVN-006 à partir d'un ovin OVN-005", () => {
    expect(nextAnimalIdentifiant("OVIN", [{ identifiant: "OVN-005" }])).toBe(
      "OVN-006"
    );
  });

  it("génère BOE-001 quand la liste est vide", () => {
    expect(nextAnimalIdentifiant("BOVIN", [])).toBe("BOE-001");
  });

  it("génère OVN-001 quand la liste est vide", () => {
    expect(nextAnimalIdentifiant("OVIN", [])).toBe("OVN-001");
  });

  it("ignore les identifiants qui ne matchent pas le préfixe", () => {
    expect(
      nextAnimalIdentifiant("BOVIN", [
        { identifiant: "BOV-001" }, // ancien format, doit être ignoré
        { identifiant: "BOE-010" },
      ])
    ).toBe("BOE-011");
  });

  it("ignore les identifiants d'une autre espèce", () => {
    expect(
      nextAnimalIdentifiant("BOVIN", [
        { identifiant: "OVN-005" }, // ovin, doit être ignoré
      ])
    ).toBe("BOE-001");
  });

  it("fait office de BOVIN quand l'espèce est null/undefined", () => {
    expect(nextAnimalIdentifiant(null, [])).toBe("BOE-001");
    expect(nextAnimalIdentifiant(undefined, [])).toBe("BOE-001");
  });
});

describe("formatBytes", () => {
  it("formate 1024 octets", () => {
    // La fonction utilise "Ko" (français) avec 1 décimale : "1.0 Ko".
    // Tolérant à "1 KB" ou "1,0 Ko" selon l'environnement.
    expect(formatBytes(1024)).toMatch(/^1[.,]0?\s*K[oB]/i);
  });

  it("formate 1048576 octets (1 Mo)", () => {
    expect(formatBytes(1048576)).toMatch(/^1[.,]0{0,2}\s*M[oB]/i);
  });

  it("formate un petit nombre d'octets", () => {
    expect(formatBytes(500)).toBe("500 o");
  });

  it("formate une valeur sous le Ko", () => {
    expect(formatBytes(512)).toBe("512 o");
  });
});
