// Schémas de validation Zod pour les saisies SAVERDEV.
// Chaque schéma correspond à un type de saisie accepté par POST /api/saisie.
// Cf. /home/z/my-project/src/app/api/saisie/route.ts pour l'application.
//
// Règles générales :
//   - dates au format ISO strict YYYY-MM-DD (regex, pas z.coerce.date()
//     car les saisies partent de FormData string côté client)
//   - montants > 0 et plafonnés à 10M FCFA (achat/vente/dépense) ou 10MM FCFA
//     pour les mouvements de capital (souscriptions apport bailleur)
//   - chaînes bornées (libellés, noms, etc.) pour éviter les saisies infinies
//   - enums stricts pour les catégories métier (espèce, sexe, type de dépense…)
//
// Usage côté API :
//   const result = schema.safeParse(data);
//   if (!result.success) {
//     return NextResponse.json(
//       { ok: false, error: "Données invalides", details: result.error.flatten() },
//       { status: 400 }
//     );
//   }

import { z } from "zod";

// Regex ISO date stricte — on n'utilise pas z.string().date() car ce dernier
// accepte aussi "2025-1-5" (sans zéro de tête), ce qui casserait le parsing
// côté serveur new Date("2025-1-5") qui devient NaN.
export const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

// ---------- Achat ----------
// Une saisie d'achat crée un Bovin (BOVIN ou OVIN) avec son prix d'achat, son
// poids, sa race, son sexe, etc. Le nbSujets permet d'acheter un lot en une
// seule saisie (ex: 10 ovins d'un coup).
export const achatSchema = z.object({
  espece: z.enum(["BOVIN", "OVIN"]),
  race: z.string().min(1).max(100),
  date: z.string().regex(isoDateRegex, "Date invalide (format attendu YYYY-MM-DD)"),
  prixUnitaire: z.number().positive().max(10_000_000, "Prix unitaire trop élevé"),
  nbSujets: z.number().int().positive().max(1000, "Trop de sujets"),
  gestionnaire: z.string().max(200).optional(),
  fournisseur: z.string().max(200).optional(),
  numRecu: z.string().max(200).optional(),
  observations: z.string().max(500).optional(),
});

// ---------- Vente ----------
// Une vente fige un Bovin avec son prix de vente, son acheteur et la date.
// Le `bovinId` doit être un cuid non vide. Le nbSujets est optionnel (par
// défaut 1, utile pour les ventes par lot d'ovins).
export const venteSchema = z.object({
  bovinId: z.string().min(1, "bovinId requis"),
  espece: z.enum(["BOVIN", "OVIN"]).optional(),
  date: z.string().regex(isoDateRegex, "Date invalide (format attendu YYYY-MM-DD)"),
  prixUnitaire: z.number().positive().max(10_000_000, "Prix unitaire trop élevé"),
  acheteur: z.string().min(1).max(200),
  nbSujets: z.number().int().positive().max(1000).optional(),
  observations: z.string().max(500).optional(),
});

// ---------- Dépense ----------
// Catégories alignées sur le CAHIER DES CHARGES SAVERDEV (§6.2 — catégories
// de dépenses). Toute autre catégorie est rejetée par le schéma.
export const depenseSchema = z.object({
  date: z.string().regex(isoDateRegex, "Date invalide (format attendu YYYY-MM-DD)"),
  categorie: z.enum([
    "Alimentation",
    "Salaires",
    "Transport",
    "Matériel",
    "Gestion de l'eau",
    "Santé",
    "Loyer",
    "Communication",
    "Événement",
    "Immobilisation",
    "Autres",
  ]),
  libelle: z.string().min(1).max(200),
  montant: z.number().positive().max(10_000_000, "Montant trop élevé"),
  modePaiement: z.enum(["Comptant", "Crédit", "Virement", "Mobile Money"]).optional(),
  nbBovinsConcernes: z.number().int().min(0).max(1000).optional(),
});

// ---------- Mouvement de capital ----------
// ENTREE (apport) ou SORTIE (retrait) du capital initial (paramètre statique
// figé dans la table Parametre). Le montant peut être élevé (jusqu'à 10MM
// FCFA) car le capital initial SAVERDEV = 14 775 000 FCFA et les
// souscriptions bailleur peuvent dépasser plusieurs millions.
export const capitalMouvementSchema = z.object({
  typeMvt: z.enum(["ENTREE", "SORTIE"]),
  date: z.string().min(1, "Date requise"),
  montant: z.number().positive().max(10_000_000_000, "Montant trop élevé"),
  libelle: z.string().min(1).max(200),
});

// ---------- Dépense d'investissement (Task 31-B) ----------
// Saisie d'une immobilisation (Hangar / Équipement / Clôture / Autre).
// Stockée côté DB comme une dépense de catégorie "Immobilisation" (compte 23).
// Le libellé est préfixé par la sous-catégorie par la couche d'application
// (lib/saisie-ops.ts) pour permettre le filtrage côté UI.
export const investissementSchema = z.object({
  date: z.string().regex(isoDateRegex, "Date invalide (format attendu YYYY-MM-DD)"),
  sousCategorie: z.enum(["Hangar", "Équipement", "Clôture", "Autre"]),
  libelle: z.string().min(1).max(200),
  montant: z.number().positive().max(10_000_000_000, "Montant trop élevé"),
});

// ---------- Stock (mouvement d'aliment bétail) ----------
// Mouvements de stock : entrée (achat d'aliments) ou sortie (consommation).
export const stockMouvementSchema = z.object({
  typeAliment: z.string().min(1).max(100),
  entree: z.number().int().min(0).max(100_000).optional(),
  sortie: z.number().int().min(0).max(100_000).optional(),
  prixParSac: z.number().min(0).max(1_000_000).optional(),
  date: z.string().regex(isoDateRegex).optional(),
  observations: z.string().max(500).optional(),
});

// ---------- Schéma global de saisie ----------
// Le wrapper qui valide le type puis dispatch vers le bon schéma.
// Task 31-B : "investissement" et "capital" ajoutés comme alias clients
// pour les journaux Saisie (6 types au total côté UI).
export const saisieEnvelopeSchema = z.object({
  type: z.enum([
    "achat",
    "vente",
    "depense",
    "stock",
    "capital_mouvement",
    // Alias UI Task 31-B
    "investissement",
    "capital",
  ]),
  // `data` est validé dynamiquement dans la route selon le type.
  data: z.record(z.unknown()),
});

/**
 * Renvoie le schéma Zod à appliquer selon le type de saisie.
 * Renvoie `null` pour les types non soumis à validation Zod stricte
 * (ex: capital_initial_update, capital_mouvement_delete — qui sont
 * gérés directement par la route hors du workflow de validation).
 */
export function getSchemaForType(type: string) {
  switch (type) {
    case "achat":
      return achatSchema;
    case "vente":
      return venteSchema;
    case "depense":
      return depenseSchema;
    case "capital_mouvement":
    case "capital":
      return capitalMouvementSchema;
    case "investissement":
      return investissementSchema;
    case "stock":
      return stockMouvementSchema;
    default:
      return null;
  }
}
