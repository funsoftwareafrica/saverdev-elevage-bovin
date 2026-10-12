// lib/saisie-ops.ts — logique métier réutilisable pour les opérations de saisie.
// Utilisée par :
//   - POST /api/saisie        : applique directement si role ≠ BENEFICIAIRE
//   - PATCH /api/validations  : applique réellement l'opération après validation E2A
//
// On factorise ici la logique d'achat / vente / dépense / stock / capital_mouvement
// pour pouvoir ré-appliquer une opération en attente de validation sans dupliquer
// le code.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export type SaisieType =
  | "achat"
  | "vente"
  | "depense"
  | "stock"
  | "capital_mouvement";

export interface SaisiePayload {
  type: SaisieType;
  data: Record<string, unknown>;
}

export interface SaisieResult {
  ok: boolean;
  id?: string;
  identifiant?: string;
  espece?: string;
  error?: string;
  status?: number;
}

/** Applique une opération de saisie. Ne crée pas de validation, ne fait pas
 *  de contrôle de rôle (cela doit être fait par l'appelant). */
export async function applySaisieOperation(payload: SaisiePayload): Promise<SaisieResult> {
  const { type, data } = payload;

  if (type === "achat") {
    const especeVal = (data.espece as string) || "BOVIN";
    const prefix = especeVal === "OVIN" ? "OVN" : "BOE";
    const gestionnaire = (data.gestionnaire as string) || "SAVERDEV";
    const countEspece = await db.bovin.count({ where: { espece: especeVal } });
    const bovin = await db.bovin.create({
      data: {
        identifiant: `${prefix}-${String(countEspece + 1).padStart(3, "0")}`,
        espece: especeVal,
        gestionnaire,
        race: (data.race as string) ?? "Zébu",
        sexe: (data.sexe as string) ?? "Mâle",
        dateAchat: new Date(data.date as string),
        prixAchat: Number(data.prixUnitaire) * Number(data.nbSujets ?? 1),
        poidsAchat: Number(data.poids ?? 0),
        statut: "EN_ENGRAISSEMENT",
        coutsEngraissement: 0,
        autresCouts: 0,
        prixVente: 0,
      },
    });
    await db.historique.create({
      data: {
        action: "ACHAT_BOVIN",
        entiteType: "Bovin",
        entiteId: bovin.id,
        details: `Achat ${bovin.identifiant} — ${bovin.prixAchat} FCFA`,
      },
    });
    return { ok: true, id: bovin.id, identifiant: bovin.identifiant, espece: bovin.espece };
  }

  if (type === "vente") {
    // Résolution du bovin à vendre :
    //  1) `bovinId` explicite → vend l'animal précis sélectionné
    //  2) `espece` ("BOVIN" | "OVIN") → 1er animal en engraissement de cette espèce
    //  3) fallback → 1er animal en engraissement sans filtre
    let bovin = null;
    const bovinId = data.bovinId ? String(data.bovinId) : null;
    const especeVal = data.espece ? String(data.espece) : null;

    if (bovinId) {
      bovin = await db.bovin.findUnique({ where: { id: bovinId } });
    } else if (especeVal === "BOVIN" || especeVal === "OVIN") {
      bovin = await db.bovin.findFirst({
        where: { statut: "EN_ENGRAISSEMENT", espece: especeVal },
        orderBy: { dateAchat: "asc" },
      });
    } else {
      bovin = await db.bovin.findFirst({
        where: { statut: "EN_ENGRAISSEMENT" },
        orderBy: { dateAchat: "asc" },
      });
    }

    if (!bovin) {
      const label = especeVal === "OVIN" ? "ovin" : especeVal === "BOVIN" ? "bovin" : "animal";
      return { ok: false, error: `Aucun ${label} disponible à la vente`, status: 400 };
    }
    if (bovin.statut !== "EN_ENGRAISSEMENT") {
      return {
        ok: false,
        error: `Cet animal n'est pas en engraissement (statut: ${bovin.statut})`,
        status: 400,
      };
    }

    const updated = await db.bovin.update({
      where: { id: bovin.id },
      data: {
        statut: "VENDU",
        dateVente: new Date(data.date as string),
        prixVente: Number(data.prixUnitaire) * Number(data.nbSujets ?? 1),
        clientVente: (data.acheteur as string) ?? "Client",
      },
    });
    await db.historique.create({
      data: {
        action: "VENTE",
        entiteType: "Bovin",
        entiteId: updated.id,
        details: `Vente ${updated.identifiant} — ${updated.prixVente} FCFA`,
      },
    });
    return { ok: true, id: updated.id, identifiant: updated.identifiant, espece: updated.espece };
  }

  if (type === "depense") {
    const depense = await db.depense.create({
      data: {
        date: new Date(data.date as string),
        categorie: (data.categorie as string) ?? "Autre",
        libelle: (data.libelle as string) ?? "",
        montant: Number(data.montant ?? 0),
        nbBovinsConcernes: 0,
      },
    });
    await db.historique.create({
      data: {
        action: "DEPENSE",
        entiteType: "Depense",
        entiteId: depense.id,
        details: `${depense.categorie} — ${depense.libelle} (${depense.montant} FCFA)`,
      },
    });
    return { ok: true, id: depense.id };
  }

  if (type === "stock") {
    const mvt = await db.stockMouvement.create({
      data: {
        date: new Date(data.date as string),
        typeAliment: (data.typeAliment as string) ?? "Son",
        entree: Number(data.entree ?? 0),
        sortie: Number(data.sortie ?? 0),
        prixParSac: Number(data.prixParSac ?? 0),
        observations: (data.observations as string) ?? null,
      },
    });
    return { ok: true, id: mvt.id };
  }

  if (type === "capital_mouvement") {
    const typeMvt = (data.typeMvt === "ENTREE" ? "ENTREE" : "SORTIE") as "ENTREE" | "SORTIE";
    const montant = Number(data.montant);
    if (!montant || montant <= 0) {
      return { ok: false, error: "Montant invalide", status: 400 };
    }
    const dateMvt = data.date ? new Date(data.date as string) : new Date();
    if (isNaN(dateMvt.getTime())) {
      return { ok: false, error: "Date invalide", status: 400 };
    }
    const mvt = await db.capitalMouvement.create({
      data: {
        date: dateMvt,
        libelle: String(data.libelle ?? "").slice(0, 200) || (typeMvt === "ENTREE" ? "Ajout de capital" : "Retrait de capital"),
        type: typeMvt,
        montant,
        saisiePar: (data.saisiePar as string) ?? null,
      },
    });
    return { ok: true, id: mvt.id };
  }

  return { ok: false, error: "Type inconnu", status: 400 };
}

/** Sérialise une opération en chaîne JSON pour stockage dans Validation.action. */
export function serializeSaisie(payload: SaisiePayload): string {
  return JSON.stringify(payload);
}

/** Désérialise une opération depuis Validation.action. */
export function deserializeSaisie(action: string): SaisiePayload | null {
  try {
    const parsed = JSON.parse(action) as SaisiePayload;
    if (!parsed.type || !parsed.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Transforme un résultat d'opération en NextResponse (utilitaire pour les routes). */
export function saisieResultToResponse(res: SaisieResult) {
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: res.error ?? "Erreur" },
      { status: res.status ?? 400 }
    );
  }
  return NextResponse.json(
    { ok: true, id: res.id, identifiant: res.identifiant, espece: res.espece },
    { status: 201 }
  );
}
